import pick from "lodash/pick";
import type { AuthOptions, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import connectDB from "#utils/database/connect";
import { Accounts, type TAccount } from "#utils/database/models/account";
import { Customers } from "#utils/database/models/customer";

import { isEmailValid } from "./common";
import { verifyVerificationToken } from "./otp";
import { verifyPassword } from "./passwordHelper";

export function verifyOtpToken(token: string) {
	verifyVerificationToken(token);
}

export const authOptions: AuthOptions = {
	secret: process.env.NEXTAUTH_SECRET,
	providers: [
		CredentialsProvider({
			id: "restaurant",
			name: "restaurant",
			credentials: {
				username: { label: "Username", type: "text", placeholder: "Enter your username or email" },
				kitchen: { label: "Kitchen Username", type: "text", placeholder: "Enter your kitchen username" },
				password: { label: "Password", type: "password", placeholder: "Enter your password" },
			},
			async authorize(cred) {
				if (!cred?.username) throw new Error("Restaurant username is required");
				if (!cred?.password) throw new Error("Password is required");

				await connectDB();
				const credential = isEmailValid(cred?.username) ? { email: cred?.username } : { username: cred?.username };
				const account = await Accounts.findOne<TAccount>(credential)
					.populate("profile")
					.populate({ path: "kitchens", match: { username: cred?.kitchen } });

				if (!account) throw new Error("Account not found.");

				if (cred?.kitchen) {
					if (!(await verifyPassword(cred?.password, account?.kitchens?.[0]?.password))) throw new Error("Invalid kitchen credentials");

					return {
						id: account._id.toString(),
						role: "kitchen",
						themeColor: account?.profile?.themeColor,
						_doc: account as unknown as TAccount, // using account as the doc
					};
				} else {
					if (!(await verifyPassword(cred?.password, account?.password))) throw new Error("Invalid admin credentials");

					return {
						id: account._id.toString(),
						role: "admin",
						themeColor: account?.profile?.themeColor,
						_doc: account as unknown as TAccount,
					};
				}
			},
		}),
		CredentialsProvider({
			id: "customer",
			name: "customer",
			credentials: {
				restaurant: { label: "Restaurant Username", type: "text", placeholder: "Enter restaurant username" },
				table: { label: "Table ID", type: "string", placeholder: "Enter the table id" },
				phone: { label: "Phone Number", type: "number", placeholder: "Enter your phone number" },
				fname: { label: "Name", type: "text", placeholder: "Enter your first name" },
				lname: { label: "Name", type: "text", placeholder: "Enter your last name" },
				verificationToken: { label: "Verification Token", type: "text" },
				tablePin: { label: "Table PIN", type: "text" },
			},
			async authorize(cred) {
				if (!cred?.restaurant) throw new Error("Restaurant id is required");
				if (!cred?.table) throw new Error("Table id is required");
				if (!cred?.phone) throw new Error("Phone number is required");

				const isDemo = cred?.restaurant === "demo" && process.env.DEMO_MODE === "true";

				if (!isDemo) {
					if (!cred?.verificationToken) throw new Error("OTP verification is required. Please complete the OTP flow first.");
					verifyOtpToken(cred.verificationToken);
				}

				await connectDB();
				let customerCred: Record<string, string | undefined> = {
					fname: cred?.fname,
					lname: cred?.lname,
					phone: cred?.phone,
				};

				let customer = await Customers.findOne({ phone: cred?.phone, restaurantID: cred?.restaurant });

				if (!customer) {
					customerCred = { ...customerCred, restaurantID: cred?.restaurant };
					customer = await new Customers(customerCred).save();
				}

				const account = await Accounts.findOne<TAccount>({ username: cred?.restaurant }).populate("profile").populate("tables");

				if (!account) throw new Error("Restaurant not found.");
				if (!account?.tables?.some?.(({ username }: { username: string }) => username === cred?.table)) throw new Error("Invalid table id");

				if (!isDemo) {
					const tableObj = account.tables.find((t) => t.username === cred?.table);
					if (tableObj?.pin && tableObj.pin !== cred?.tablePin) {
						throw new Error("Invalid table PIN. Please use the PIN printed on the table QR card.");
					}
				}

				return {
					id: customer._id.toString(),
					role: "customer",
					themeColor: account?.profile?.themeColor,
					_doc: {
						role: "customer",
						customer: customer,
						restaurant: {
							username: account?.profile?.restaurantID,
							table: cred?.table,
							name: account?.profile?.name,
							avatar: account?.profile?.avatar,
						},
						// biome-ignore lint/suspicious/noExplicitAny: next-auth authorize return type is complex
					} as any,
				};
			},
		}),
	],
	session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
	callbacks: {
		async session({ session, token }) {
			if (token.expiresAt && Date.now() > (token.expiresAt as number)) {
				return {} as Session;
			}
			session = {
				...session,
				...token?.user,
			};
			delete session.user;
			return session;
		},
		async jwt({ token, user, account }) {
			if (user) {
				const maxAge = (user as { role?: string }).role === "customer" ? 24 * 60 * 60 : 8 * 60 * 60;
				token.expiresAt = Date.now() + maxAge * 1000;
			}

			if (account?.provider === "restaurant") {
				if (user) {
					token.user = {
						role: user?.role,
						themeColor: user?.themeColor,
						...pick(user._doc, ["email", "accountActive", "subscriptionActive", "username", "verified"]),
					};
				}
			}

			if (account?.provider === "customer") {
				if (user) {
					token.user = user._doc;
				}
			}
			return token;
		},
	},
};
