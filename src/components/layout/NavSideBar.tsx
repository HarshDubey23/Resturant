"use client";

import { LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { type ReactNode, useEffect, useState } from "react";
import { useAdmin } from "#components/context/useContext";
import { useQueryParams } from "#utils/hooks/useQueryParams";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface NavItem {
	label: string;
	value: string;
	icon: ReactNode;
}

interface NavSideBarProps {
	navItems: NavItem[];
	defaultTab: string;
	head?: boolean;
	foot?: boolean;
}

export default function NavSideBar({ navItems, defaultTab, head, foot }: NavSideBarProps) {
	const router = useRouter();
	const session = useSession();
	const { profile } = useAdmin();
	const queryParams = useQueryParams();
	const tab = queryParams.get("tab") ?? "";
	const [mobileOpen, setMobileOpen] = useState(false);

	const onNavClick = (value: string) => {
		if (value === "signout") {
			router.push("/logout");
			return;
		}
		queryParams.set({ tab: value });
		setMobileOpen(false);
	};

	useEffect(() => {
		if (!tab) queryParams.set({ tab: defaultTab });
	}, [defaultTab, queryParams, tab]);

	const restaurantName = profile?.name ?? session?.data?.restaurant?.name ?? "Restaurant";
	const restaurantAvatar = profile?.avatar ?? session?.data?.restaurant?.avatar;
	const restaurantInitial = restaurantName.charAt(0).toUpperCase() || "R";

	// Filter out signout from the visible nav (it goes in footer)
	const visibleNavItems = navItems.filter((item) => item.value !== "signout");

	return (
		<>
			{/* Desktop sidebar — visible on lg+ */}
			<aside className="hidden lg:flex flex-col w-[250px] shrink-0 h-screen bg-violet-700 text-white">
				{/* Header: restaurant identity */}
				<div className="p-6 border-b border-white/10">
					<div className="flex items-center gap-3">
						<Avatar className="h-10 w-10 rounded-xl border border-white/20 shadow-sm">
							{restaurantAvatar ? <AvatarImage src={restaurantAvatar} alt={restaurantName} /> : null}
							<AvatarFallback className="rounded-xl bg-white/20 text-white text-sm font-bold">{restaurantInitial}</AvatarFallback>
						</Avatar>
						<div className="min-w-0">
							<h2 className="text-sm font-bold tracking-tight truncate max-w-[170px]">{restaurantName}</h2>
							{session.status === "authenticated" && (
								<span className="inline-flex items-center gap-1 mt-0.5 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
									Live
								</span>
							)}
						</div>
					</div>
				</div>

				{/* Optional head spacer */}
				{head && <div className="h-2" />}

				{/* Navigation */}
				<nav className={cn("flex flex-col gap-1 px-4 py-4 overflow-y-auto scrollbar-hide", head && "mt-auto", foot && "flex-1")}>
					{visibleNavItems.map((item) => {
						if (item.value === "signout" && session.status !== "authenticated") return null;
						const active = tab === item.value;
						return (
							<button
								key={item.value}
								onClick={() => onNavClick(item.value)}
								aria-current={active ? "page" : undefined}
								className={cn(
									"relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
									active ? "bg-white/10 text-white font-semibold" : "text-white/60 hover:text-white hover:bg-white/5",
								)}>
								{active && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-white" />}
								<span className={cn("h-5 w-5 shrink-0 transition-colors", active ? "text-white" : "text-white/60")}>{item.icon}</span>
								<span className="capitalize leading-none">{item.label}</span>
							</button>
						);
					})}
				</nav>

				{/* Footer: logout */}
				{foot && session.status === "authenticated" && (
					<div className="border-t border-white/10 p-4">
						<Link
							href="/logout"
							className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200 ease-out">
							<LogOut className="h-5 w-5 shrink-0" />
							<span>Sign out</span>
						</Link>
					</div>
				)}
			</aside>

			{/* Mobile: bottom nav bar — visible below lg */}
			<nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-slate-200/50 bg-white/95 backdrop-blur-sm safe-area-bottom">
				<div className="flex items-center justify-around py-2 px-2">
					{visibleNavItems.slice(0, 4).map((item) => {
						const active = tab === item.value;
						return (
							<button
								key={item.value}
								onClick={() => onNavClick(item.value)}
								aria-current={active ? "page" : undefined}
								className={cn(
									"flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 ease-out min-w-[56px]",
									active ? "text-violet-600" : "text-slate-500 hover:text-slate-700",
								)}>
								<span className={cn("h-5 w-5 shrink-0", active ? "text-violet-600" : "text-slate-400")}>{item.icon}</span>
								<span className={cn("text-[10px] font-medium capitalize leading-none", active && "font-semibold")}>{item.label}</span>
							</button>
						);
					})}
					{/* More button: opens drawer for remaining items */}
					{visibleNavItems.length > 4 && (
						<button
							onClick={() => setMobileOpen(true)}
							className="flex flex-col items-center gap-1 p-2 rounded-xl text-slate-500 hover:text-slate-700 transition-all duration-200 ease-out min-w-[56px]">
							<Menu className="h-5 w-5 shrink-0 text-slate-400" />
							<span className="text-[10px] font-medium capitalize leading-none">More</span>
						</button>
					)}
				</div>
			</nav>

			{/* Mobile drawer overlay */}
			{mobileOpen && (
				<div className="fixed inset-0 z-50 lg:hidden">
					{/* Backdrop */}
					<div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} aria-hidden="true" />
					{/* Drawer panel */}
					<div className="absolute inset-y-0 left-0 w-[280px] bg-violet-700 text-white shadow-soft-hover overflow-y-auto">
						{/* Close button */}
						<button
							onClick={() => setMobileOpen(false)}
							className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-xl text-white/60 hover:text-white hover:bg-white/10 transition-all"
							aria-label="Close menu">
							<X className="h-5 w-5" />
						</button>

						{/* Restaurant identity */}
						<div className="p-6 border-b border-white/10">
							<div className="flex items-center gap-3">
								<Avatar className="h-10 w-10 rounded-xl border border-white/20 shadow-sm">
									{restaurantAvatar ? <AvatarImage src={restaurantAvatar} alt={restaurantName} /> : null}
									<AvatarFallback className="rounded-xl bg-white/20 text-white text-sm font-bold">{restaurantInitial}</AvatarFallback>
								</Avatar>
								<div className="min-w-0">
									<h2 className="text-sm font-bold tracking-tight truncate max-w-[170px]">{restaurantName}</h2>
									{session.status === "authenticated" && (
										<span className="inline-flex items-center gap-1 mt-0.5 rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-400 ring-1 ring-emerald-500/30">
											Live
										</span>
									)}
								</div>
							</div>
						</div>

						{/* All nav items */}
						<div className="flex flex-col gap-1 px-4 py-4">
							{visibleNavItems.map((item) => {
								const active = tab === item.value;
								return (
									<button
										key={item.value}
										onClick={() => onNavClick(item.value)}
										aria-current={active ? "page" : undefined}
										className={cn(
											"relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-all duration-200 ease-out",
											active ? "bg-white/10 text-white font-semibold" : "text-white/60 hover:text-white hover:bg-white/5",
										)}>
										{active && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 rounded-r-full bg-white" />}
										<span className={cn("h-5 w-5 shrink-0", active ? "text-white" : "text-white/60")}>{item.icon}</span>
										<span className="capitalize leading-none">{item.label}</span>
									</button>
								);
							})}
						</div>

						{/* Logout */}
						{foot && session.status === "authenticated" && (
							<div className="border-t border-white/10 p-4 mt-auto">
								<Link
									href="/logout"
									className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all duration-200 ease-out">
									<LogOut className="h-5 w-5 shrink-0" />
									<span>Sign out</span>
								</Link>
							</div>
						)}
					</div>
				</div>
			)}
		</>
	);
}
