"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { type ReactNode, useEffect } from "react";
import { useQueryParams } from "#utils/hooks/useQueryParams";
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
	const queryParams = useQueryParams();
	const tab = queryParams.get("tab") ?? "";

	const onNavClick = (value: string) => {
		if (value === "signout") return router.push("/logout");
		queryParams.set({ tab: value });
	};

	useEffect(() => {
		if (!tab) queryParams.set({ tab: defaultTab });
	}, [defaultTab, queryParams, tab]);

	return (
		<aside className="flex flex-col border-r bg-muted/20 w-16 lg:w-20 shrink-0">
			<nav className={cn("flex flex-col items-center gap-1 py-3", head && "mt-auto", foot && "mt-auto")}>
				{navItems.map((item) => {
					if (item.value === "signout" && session.status !== "authenticated") return null;
					const active = tab === item.value;
					return (
						<button
							key={item.value}
							onClick={() => onNavClick(item.value)}
							className={cn(
								"flex flex-col items-center gap-1 rounded-lg p-2 w-14 lg:w-16 transition-colors",
								active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
							)}
							title={item.label}>
							<span className={cn("h-5 w-5", active && "text-primary")}>{item.icon}</span>
							<span className="text-[10px] leading-tight font-medium capitalize">{item.label}</span>
						</button>
					);
				})}
			</nav>
		</aside>
	);
}
