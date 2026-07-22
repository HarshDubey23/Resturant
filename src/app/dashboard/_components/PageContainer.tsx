"use client";

import { ExternalLink, LogOut } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { type UIEvent, useEffect, useState } from "react";
import { useAdmin } from "#components/context/useContext";
import { useQueryParams } from "#utils/hooks/useQueryParams";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
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
	const { profile, profileLoading, sseStatus } = useAdmin();
	const [floatHeader, setFloatHeader] = useState(false);
	const queryParams = useQueryParams();
	const tab = queryParams.get("tab") ?? "overview";

	const onScroll = (event: UIEvent<HTMLDivElement>) => {
		setFloatHeader((event.target as HTMLDivElement).scrollTop >= 1);
	};

	useEffect(() => {
		if (session.status === "unauthenticated") queryParams.router.replace("/");
		if (session?.data?.role === "kitchen") queryParams.router.replace("/kitchen");
	}, [queryParams.router, session]);

	const restaurantName = profile?.name ?? session?.data?.restaurant?.name ?? "My Restaurant";
	const restaurantSlug = session?.data?.restaurant?.username;
	const restaurantAvatar = profile?.avatar ?? session?.data?.restaurant?.avatar;
	const restaurantInitial = restaurantName.charAt(0).toUpperCase() || "R";

	return (
		<div className="flex h-screen flex-col bg-background">
			<header className={`sticky top-0 z-20 border-b bg-background/95 backdrop-blur transition-all ${floatHeader ? "shadow-md shadow-black/5" : ""}`}>
				<div className="flex items-center justify-between px-4 sm:px-6 h-16 gap-3">
					{/* Left: Restaurant identity */}
					<div className="flex items-center gap-3 min-w-0">
						{profileLoading ? (
							<Skeleton className="h-10 w-10 rounded-xl" />
						) : (
							<Avatar className="h-10 w-10 rounded-xl border border-border/60 shadow-sm">
								{restaurantAvatar ? <AvatarImage src={restaurantAvatar} alt={restaurantName} /> : null}
								<AvatarFallback className="rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground font-bold">
									{restaurantInitial}
								</AvatarFallback>
							</Avatar>
						)}
						<div className="min-w-0 hidden sm:block">
							<div className="flex items-center gap-2">
								<h1 className="text-base font-bold tracking-tight truncate max-w-[180px]">{restaurantName}</h1>
								<span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-600 ring-1 ring-emerald-200">
									Live
								</span>
							</div>
							<div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
								<span className="capitalize">{tab}</span>
								{restaurantSlug && (
									<>
										<span aria-hidden>·</span>
										<Link
											href={`/${restaurantSlug}`}
											target="_blank"
											className="inline-flex items-center gap-0.5 text-primary hover:underline font-medium">
											View menu
											<ExternalLink className="h-2.5 w-2.5" />
										</Link>
									</>
								)}
							</div>
						</div>
						{/* Mobile: show tab name only */}
						<h1 className="text-base font-semibold capitalize tracking-tight sm:hidden">{tab}</h1>
					</div>

					{/* Right: Sub-nav + logout */}
					<div className="flex items-center gap-2">
						<NavTopBar />
						<Link
							href="/logout"
							className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
							aria-label="Sign out"
							title="Sign out">
							<LogOut className="h-4 w-4" />
						</Link>
					</div>
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
				<div className="p-4 sm:p-6 max-w-7xl mx-auto">
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
