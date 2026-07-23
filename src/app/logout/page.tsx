"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useEffect, useRef } from "react";

export default function Logout() {
	const router = useRouter();
	const session = useSession();
	const stashedRef = useRef<{ role?: string; restaurant?: string; table?: string } | null>(null);
	const redirectedRef = useRef(false);

	useEffect(() => {
		// Avoid multiple redirects in StrictMode / session re-renders
		if (redirectedRef.current) return;

		if (session?.status === "authenticated") {
			// Stash role info BEFORE signOut so we know where to send the user after
			stashedRef.current = {
				role: session?.data?.role as string | undefined,
				restaurant: session?.data?.restaurant?.username as string | undefined,
				table: session?.data?.restaurant?.table as string | undefined,
			};
			signOut({ redirect: false }).catch(() => {
				// If signOut fails, send them home anyway
				redirectedRef.current = true;
				router.replace("/");
			});
		} else if (session?.status === "unauthenticated") {
			redirectedRef.current = true;
			const { role, restaurant, table } = stashedRef.current ?? {};
			if (role === "customer" && restaurant) {
				router.replace(`/${restaurant}${table ? `?table=${table}` : ""}`);
			} else {
				router.replace("/");
			}
		}
	}, [router, session]);

	return (
		<div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
			<Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
			<p className="text-sm text-muted-foreground">Signing out…</p>
		</div>
	);
}
