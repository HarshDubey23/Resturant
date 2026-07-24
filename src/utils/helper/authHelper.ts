import pick from "lodash/pick";
import type { AuthOptions, Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import connectDB from "#utils/database/connect";
import { Accounts, type TAccount } from "#utils/database/models/account";
import { Customers } from "#utils/database/models/customer";

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
				// NextAuth convention: return `null` on any auth failure so the client
				// receives a generic `CredentialsSignin` error (no info leakage about
				// whether the account exists). The client surfaces a friendly toast.
				const identifier = cred?.username?.trim();
				const password = cred?.password;
				if (!identifier || !password) return null;

				await connectDB();
				// Look up by either email OR restaurant slug (username) in a single
				// query. Both fields are stored lowercase (see AccountSchema), so we
				// lowercase the identifier to match regardless of user input case.
				const lower = identifier.toLowerCase();
				const account = await Accounts.findOne<TAccount>({
					$or: [{ email: lower }, { username: lower }],
				})
					.populate("profile")
					.populate({ path: "kitchens", match: { username: cred?.kitchen } });

				if (!account) return null;

				if (cred?.kitchen) {
					const kitchen = account?.kitchens?.[0];
					if (!kitchen || !(await verifyPassword(password, kitchen?.password))) return null;
					return {
						id: account._id.toString(),
						role: "kitchen" as const,
						name: kitchen?.username ?? account?.profile?.name,
						username: account?.username,
						themeColor: account?.profile?.themeColor,
						_doc: account as unknown as Record<string, unknown>, // using account as the doc
					};
				}

				if (!(await verifyPassword(password, account?.password))) return null;

				return {
					id: account._id.toString(),
					role: "admin" as const,
					name: account?.profile?.name ?? account?.username,
					username: account?.username,
					themeColor: account?.profile?.themeColor,
					_doc: account as unknown as Record<string, unknown>,
				};
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

				// Demo mode is a development-only convenience. It is hard-disabled in
				// production builds regardless of how DEMO_MODE is configured, so a
				// misconfigured environment variable can never bypass authentication.
				const isDemo = cred?.restaurant === "demo" && process.env.NODE_ENV !== "production" && process.env.DEMO_MODE === "true";

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
					name: `${cred?.fname ?? ""} ${cred?.lname ?? ""}`.trim() || undefined,
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
					} as Record<string, unknown>,
				};
			},
		}),
	],
	session: { strategy: "jwt", maxAge: 24 * 60 * 60 },
	callbacks: {
		async session({ session, token }) {
			if (token.expiresAt && Date.now() > (token.expiresAt as number)) {
				// Return null-like session with explicit expiry flag so downstream
				// checks (if (!session) / if (!session.user?.role)) correctly reject.
				return { expires: new Date(0).toISOString(), user: {} } as Session;
			}
			// Populate `session.user` with the JWT-attached user fields so call
			// sites can use the correct NextAuth shape (`session.user.role`).
			// The token fields are ALSO spread onto the session root for backward
			// compatibility with the many existing `session.role` / `session.username`
			// call sites that have not yet been migrated — see worklog Task 1-A.
			const tokenUser = (token?.user ?? {}) as Record<string, unknown>;
			return {
				...session,
				...tokenUser,
				user: {
					...(session.user ?? {}),
					...tokenUser,
				},
			};
		},
		async jwt({ token, user, account }) {
			if (user) {
				const maxAge = (user as { role?: string }).role === "customer" ? 24 * 60 * 60 : 8 * 60 * 60;
				token.expiresAt = Date.now() + maxAge * 1000;
			}

			// `user` is the object returned from `authorize`. It carries an internal
			// `_doc` field (the populated account / synthetic customer context) that
			// we project onto `token.user`. `_doc` is typed on the extended User
			// interface in `next-auth.d.ts` but kept out of the public session shape.
			// @reason: the jwt callback's `user` param is `User | AdapterUser`; the
			// cast guarantees `_doc` access regardless of which union member next-auth
			// resolves at the type level.
			const u = user as (typeof user) & { _doc?: Record<string, unknown> };

			if (account?.provider === "restaurant") {
				if (user) {
					token.user = {
						role: u?.role,
						name: u?.name,
						themeColor: u?.themeColor,
						...pick(u?._doc ?? {}, ["email", "accountActive", "subscriptionActive", "username", "verified", "platformAdmin"]),
					} as unknown as typeof token.user;
				}
			}

			if (account?.provider === "customer") {
				if (user) {
					token.user = (u?._doc ?? {}) as unknown as typeof token.user;
				}
			}
			return token;
		},
	},
};
