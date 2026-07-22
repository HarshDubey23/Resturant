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
		<aside className="flex flex-col border-r bg-card/80 backdrop-blur-sm w-16 lg:w-20 shrink-0">
			<nav className={cn("flex flex-col items-center gap-1 py-4 px-1", head && "mt-auto", foot && "mt-auto")}>
				{navItems.map((item) => {
					if (item.value === "signout" && session.status !== "authenticated") return null;
					const active = tab === item.value;
					return (
						<button
							key={item.value}
							onClick={() => onNavClick(item.value)}
							className={cn(
								"flex flex-col items-center gap-1.5 rounded-xl p-2 w-14 lg:w-16 transition-all duration-200",
								active
									? "bg-primary/10 text-primary shadow-sm"
									: "text-muted-foreground hover:text-foreground hover:bg-muted/50",
							)}
							title={item.label}>
							<span className={cn("h-5 w-5 transition-colors", active && "text-primary")}>{item.icon}</span>
							<span className={cn("text-[10px] leading-tight font-medium capitalize", active && "text-primary font-semibold")}>{item.label}</span>
							{active && <div className="absolute left-0 w-1 h-6 rounded-r-full bg-primary" />}
						</button>
					);
				})}
			</nav>
		</aside>
	);
}
