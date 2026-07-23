"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { type ReactNode, useEffect } from "react";
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

	const onNavClick = (value: string) => {
		if (value === "signout") {
			router.push("/logout");
			return;
		}
		queryParams.set({ tab: value });
	};

	useEffect(() => {
		if (!tab) queryParams.set({ tab: defaultTab });
	}, [defaultTab, queryParams, tab]);

	const restaurantName = profile?.name ?? session?.data?.restaurant?.name ?? "Restaurant";
	const restaurantAvatar = profile?.avatar ?? session?.data?.restaurant?.avatar;
	const restaurantInitial = restaurantName.charAt(0).toUpperCase() || "R";

	return (
		<aside className="flex flex-col border-r bg-card/80 backdrop-blur-sm w-16 lg:w-20 shrink-0 h-screen">
			{/* Optional header slot (logo / brand) */}
			{head && <div className="h-2" />}

			<nav className={cn("flex flex-col items-center gap-1 px-1 py-3 overflow-y-auto scrollbar-hide", head && "mt-auto", foot && "flex-1")}>
				{navItems.map((item) => {
					if (item.value === "signout" && session.status !== "authenticated") return null;
					const active = tab === item.value;
					return (
						<button
							key={item.value}
							onClick={() => onNavClick(item.value)}
							aria-current={active ? "page" : undefined}
							className={cn(
								"relative flex flex-col items-center gap-1.5 rounded-xl p-2 w-14 lg:w-16 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
								active ? "bg-primary/10 text-primary shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
							)}
							title={item.label}>
							{active && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-1 rounded-r-full bg-primary" />}
							<span className={cn("h-5 w-5 transition-colors", active && "text-primary")}>{item.icon}</span>
							<span className={cn("text-[10px] leading-tight font-medium capitalize", active && "text-primary font-semibold")}>{item.label}</span>
						</button>
					);
				})}
			</nav>

			{/* Footer: restaurant avatar + logout */}
			{foot && (
				<div className="border-t border-border/60 py-3 px-1 flex flex-col items-center gap-2">
					<Avatar className="h-9 w-9 rounded-lg border border-border/60 shadow-sm">
						{restaurantAvatar ? <AvatarImage src={restaurantAvatar} alt={restaurantName} /> : null}
						<AvatarFallback className="rounded-lg bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-xs font-bold">
							{restaurantInitial}
						</AvatarFallback>
					</Avatar>
					{session.status === "authenticated" && (
						<Link
							href="/logout"
							className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all"
							title="Sign out">
							<LogOut className="h-4 w-4" />
						</Link>
					)}
				</div>
			)}
		</aside>
	);
}
