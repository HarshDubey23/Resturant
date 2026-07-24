import type { Session } from "next-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "./authHelper";

export type Permission =
	| "orders.read"
	| "orders.write"
	| "orders.cancel"
	| "menu.read"
	| "menu.write"
	| "kds.view"
	| "kds.action"
	| "analytics.view"
	| "analytics.export"
	| "payments.refund"
	| "payments.reconcile"
	| "staff.manage"
	| "outlets.manage"
	| "settings.manage";

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
	owner: [
		"orders.read",
		"orders.write",
		"orders.cancel",
		"menu.read",
		"menu.write",
		"kds.view",
		"kds.action",
		"analytics.view",
		"analytics.export",
		"payments.refund",
		"payments.reconcile",
		"staff.manage",
		"outlets.manage",
		"settings.manage",
	],
	manager: ["orders.read", "orders.write", "orders.cancel", "menu.read", "menu.write", "kds.view", "kds.action", "analytics.view", "payments.refund", "staff.manage"],
	captain: ["orders.read", "orders.write", "kds.view"],
	waiter: ["orders.read", "orders.write"],
	chef: ["orders.read", "kds.view", "kds.action"],
	kitchen: ["orders.read", "kds.view", "kds.action"],
};

export type SessionWithRole = Session & { role?: string; permissions?: string[] };

export async function requirePermission(permission: Permission): Promise<SessionWithRole> {
	const session = (await getServerSession(authOptions)) as SessionWithRole | null;
	if (!session) {
		throw { status: 401, message: "Unauthorized" };
	}

	if (session.role === "admin") {
		return session;
	}

	const allowed = ROLE_PERMISSIONS[session.role ?? ""] || [];
	const userPermissions = session.permissions?.length ? session.permissions : allowed;
	if (!userPermissions.includes(permission)) {
		throw { status: 403, message: `Forbidden: missing permission '${permission}'` };
	}

	return session;
}

export function withPermission<T>(permission: Permission, handler: (req: Request, session: SessionWithRole) => Promise<T>) {
	return async (req: Request): Promise<T | Response> => {
		try {
			const session = await requirePermission(permission);
			return await handler(req, session);
		} catch (err) {
			if (err && typeof err === "object" && "status" in err) {
				return new Response((err as { message?: string }).message ?? "Forbidden", { status: (err as { status: number }).status });
			}
			return new Response("Forbidden", { status: 403 });
		}
	};
}
