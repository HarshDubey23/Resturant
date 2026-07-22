"use client";

import { useSession } from "next-auth/react";
import { type UIEvent, useEffect, useState } from "react";
import { useAdmin } from "#components/context/useContext";
import { useQueryParams } from "#utils/hooks/useQueryParams";
import Analytics from "./Analytics/Analytics";
import Campaigns from "./Campaigns/Campaigns";
import Invoices from "./Invoices/Invoices";
import Loyalty from "./Loyalty/Loyalty";
import NavTopBar from "./Orders/NavTopBar";
import Orders from "./Orders/Orders";
import Overview from "./Overview/Overview";
import Settings from "./Settings/Settings";

export default function PageContainer() {
	const session = useSession();
	const { sseStatus } = useAdmin();
	const [floatHeader, setFloatHeader] = useState(false);
	const queryParams = useQueryParams();
	const tab = queryParams.get("tab") ?? "overview";
	const _subTab = queryParams.get("subTab") ?? "";

	const onScroll = (event: UIEvent<HTMLDivElement>) => {
		setFloatHeader((event.target as HTMLDivElement).scrollTop >= 1);
	};

	const _onTabChange = (value: string) => {
		queryParams.set({ tab: value });
	};

	useEffect(() => {
		if (session.status === "unauthenticated") queryParams.router.replace("/");
		if (session?.data?.role === "kitchen") queryParams.router.replace("/kitchen");
	}, [queryParams.router, session]);

	return (
		<div className="flex h-screen flex-col bg-background">
			<header className={`sticky top-0 z-20 border-b bg-background transition-shadow ${floatHeader ? "shadow-sm" : ""}`}>
				<div className="flex items-center justify-between px-4 sm:px-6 h-14">
					<h1 className="text-lg font-semibold capitalize tracking-tight">{tab}</h1>
					<NavTopBar />
				</div>
			</header>

			{/* Live-order feed health — staff must know immediately if real-time
			    updates have stopped instead of silently missing orders. */}
			{sseStatus === "reconnecting" && (
				<div role="alert" className="flex items-center gap-2 bg-amber-500/15 px-4 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
					<span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
					Connection lost — reconnecting to live orders…
				</div>
			)}

			<div className="flex-1 overflow-auto" onScroll={onScroll}>
				<div className="p-4 sm:p-6">
					{tab === "overview" && <Overview />}
					{tab === "orders" && <Orders onScroll={onScroll} />}
					{tab === "analytics" && <Analytics />}
					{tab === "campaigns" && <Campaigns />}
					{tab === "invoices" && <Invoices />}
					{tab === "loyalty" && <Loyalty />}
					{tab === "settings" && <Settings onScroll={onScroll} />}
				</div>
			</div>
		</div>
	);
}
