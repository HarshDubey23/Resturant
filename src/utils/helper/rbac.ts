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

type SessionWithRole = Session & { role?: string; permissions?: string[] };

export function withPermission<T>(permission: Permission, handler: (req: Request, session: SessionWithRole) => Promise<T>) {
	return async (req: Request): Promise<T | Response> => {
		const session = (await getServerSession(authOptions)) as SessionWithRole | null;
		if (!session) {
			return new Response("Unauthorized", { status: 401 });
		}

		if (session.role === "admin") {
			return handler(req, session);
		}

		const allowed = ROLE_PERMISSIONS[session.role ?? ""] || [];
		const userPermissions = session.permissions?.length ? session.permissions : allowed;
		if (!userPermissions.includes(permission)) {
			return new Response(`Forbidden: missing permission '${permission}'`, { status: 403 });
		}

		return handler(req, session);
	};
}
