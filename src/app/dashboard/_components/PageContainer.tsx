"use client";

import { useSession } from "next-auth/react";
import { type UIEvent, useEffect, useState } from "react";
import { useQueryParams } from "#utils/hooks/useQueryParams";
import NavTopBar from "./Orders/NavTopBar";
import Analytics from "./Analytics/Analytics";
import Campaigns from "./Campaigns/Campaigns";
import Loyalty from "./Loyalty/Loyalty";
import Orders from "./Orders/Orders";
import Settings from "./Settings/Settings";

export default function PageContainer() {
	const session = useSession();
	const [floatHeader, setFloatHeader] = useState(false);
	const queryParams = useQueryParams();
	const tab = queryParams.get("tab") ?? "orders";
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

			<div className="flex-1 overflow-auto" onScroll={onScroll}>
				<div className="p-4 sm:p-6">
					{tab === "orders" && <Orders onScroll={onScroll} />}
					{tab === "analytics" && <Analytics />}
					{tab === "campaigns" && <Campaigns />}
					{tab === "loyalty" && <Loyalty />}
					{tab === "settings" && <Settings onScroll={onScroll} />}
				</div>
			</div>
		</div>
	);
}
