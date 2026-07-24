"use client";

import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { type UIEvent, useEffect } from "react";
import { useAdmin } from "#components/context/useContext";
import { useQueryParams } from "#utils/hooks/useQueryParams";
import Analytics from "./Analytics/Analytics";
import StaffTips from "./Analytics/StaffTips";
import Campaigns from "./Campaigns/Campaigns";
import CashierBilling from "./Cashier/CashierBilling";
import { NegativeFeedbackInbox } from "./Feedback";
import Invoices from "./Invoices/Invoices";
import Loyalty from "./Loyalty/Loyalty";
import NavTopBar from "./Orders/NavTopBar";
import Orders from "./Orders/Orders";
import Overview from "./Overview/Overview";
import Settings from "./Settings/Settings";

export default function PageContainer() {
	const session = useSession();
	const { sseStatus } = useAdmin();
	const queryParams = useQueryParams();
	const tab = queryParams.get("tab") ?? "overview";

	const onScroll = (_event: UIEvent<HTMLDivElement>) => {};

	useEffect(() => {
		if (session.status === "unauthenticated") queryParams.router.replace("/");
		if (session?.data?.role === "kitchen") queryParams.router.replace("/kitchen");
	}, [queryParams.router, session]);

	const restaurantSlug = session?.data?.restaurant?.username;

	return (
		<div className="flex h-screen flex-col bg-slate-50">
			{/* SSE reconnect banner */}
			{sseStatus === "reconnecting" && (
				<div role="alert" className="flex items-center gap-2 bg-amber-500/15 px-4 py-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
					<span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
					Connection lost — reconnecting to live orders…
				</div>
			)}

			{/* Main content area */}
			<div className="flex-1 overflow-y-auto p-8">
				<div className="max-w-7xl mx-auto">
					{/* Page title + sub-nav + link */}
					<div className="flex items-center justify-between mb-6">
						<div className="flex items-center gap-4">
							<h1 className="text-lg font-bold tracking-tight text-slate-900 capitalize">{tab}</h1>
							<NavTopBar />
						</div>
						{restaurantSlug && tab === "overview" && (
							<Link
								href={`/${restaurantSlug}`}
								target="_blank"
								className="inline-flex items-center gap-1 text-sm text-violet-600 hover:text-violet-700 font-medium transition-all duration-200">
								View menu
								<ExternalLink className="h-3.5 w-3.5" />
							</Link>
						)}
					</div>

					{tab === "overview" && <Overview />}
					{tab === "orders" && <Orders onScroll={onScroll} />}
					{tab === "cashier" && <CashierBilling />}
					{tab === "analytics" && <Analytics />}
					{tab === "staff-tips" && <StaffTips />}
					{tab === "feedback" && <NegativeFeedbackInbox />}
					{tab === "campaigns" && <Campaigns />}
					{tab === "invoices" && <Invoices />}
					{tab === "loyalty" && <Loyalty />}
					{tab === "settings" && <Settings onScroll={onScroll} />}
				</div>
			</div>
		</div>
	);
}
