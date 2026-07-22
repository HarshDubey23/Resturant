import "next-auth";

import type { TAccount } from "#utils/database/models/account";
import type { TCustomer } from "#utils/database/models/customer";
import type { TProfile } from "#utils/database/models/profile";

type AuthUser = Partial<
	Omit<TAccount, "profile"> & {
		role: "owner" | "manager" | "captain" | "waiter" | "chef" | "kitchen" | "customer" | "admin";
		customer: Partial<TCustomer>;
		themeColor: TProfile["themeColor"];
		outletId: string;
		permissions: string[];
		restaurant: Partial<{
			username: string;
			table: string;
			name: string;
			avatar: string;
		}>;
	}
>;

declare module "next-auth" {
	interface User {
		role: "owner" | "manager" | "captain" | "waiter" | "chef" | "kitchen" | "customer" | "admin";
		themeColor: TProfile["themeColor"];
		_doc: AuthUser;
	}

	interface Session extends AuthUser {
		expires: string;
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		user: AuthUser;
	}
}
