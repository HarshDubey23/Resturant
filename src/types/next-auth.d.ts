import "next-auth";

import type { TCustomer } from "#utils/database/models/customer";
import type { TProfile } from "#utils/database/models/profile";

export type AuthRole = "owner" | "manager" | "captain" | "waiter" | "chef" | "kitchen" | "customer" | "admin";

/**
 * Restaurant context attached to the session when a customer is authenticated.
 * Mirrors the subset of the profile the customer-side authorize callback returns.
 */
export interface RestaurantContext {
	username: string;
	table?: string;
	name?: string;
	avatar?: string;
}

/**
 * User shape that next-auth populates both on the JWT and on `session.user`.
 * Previously the codebase declared `interface Session extends AuthUser` (a type
 * lie — NextAuth always wraps the user under `session.user`). This declaration
 * matches the actual runtime shape produced by the `session` callback in
 * `authHelper.ts`, which now writes the JWT-attached fields onto `session.user`
 * (while ALSO spreading them onto the session root for backward compatibility
 * with the many existing `session.role` / `session.username` call sites that
 * the orchestrator will migrate separately).
 */
declare module "next-auth" {
	interface User {
		id?: string;
		name?: string | null;
		email?: string | null;
		image?: string | null;
		role?: AuthRole;
		username?: string;
		restaurantID?: string;
		restaurant?: RestaurantContext;
		customer?: Partial<TCustomer>;
		themeColor?: TProfile["themeColor"];
		outletId?: string;
		permissions?: string[];
		accountActive?: boolean;
		subscriptionActive?: boolean;
		verified?: boolean;
		platformAdmin?: boolean;
		// Internal: the `authorize` callback attaches the populated account doc
		// (or synthetic customer context) here so the `jwt` callback can project
		// specific fields onto `token.user`. Not part of the public session shape.
		// @reason: next-auth's User type has no slot for the source document;
		// this field carries it from authorize → jwt without leaking it to clients.
		_doc?: Record<string, unknown>;
	}

	interface Session {
		user: User;
		expires: string;
	}
}

declare module "next-auth/jwt" {
	interface JWT {
		user: User;
		expiresAt?: number;
	}
}
