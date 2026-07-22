"use client";

import { useEffect } from "react";
import { useQueryParams } from "#utils/hooks/useQueryParams";
import { cn } from "@/lib/utils";

interface NavTopBarProps {
	menuOpen?: boolean;
}

const subNavItems: Record<string, Array<{ label: string; route: string }>> = {
	home: [
		{ label: "overview", route: "overview" },
		{ label: "bills", route: "bills" },
	],
	orders: [
		{ label: "requests", route: "requests" },
		{ label: "active", route: "active" },
		{ label: "history", route: "history" },
	],
	settings: [
		{ label: "account", route: "account" },
		{ label: "business", route: "business" },
		{ label: "menu", route: "menu" },
		{ label: "tables", route: "tables" },
		{ label: "ai keys", route: "ai-keys" },
	],
};

export default function NavTopBar({ menuOpen }: NavTopBarProps) {
	const queryParams = useQueryParams();
	const tab = queryParams.get("tab") ?? "";
	const subTab = queryParams.get("subTab") ?? "";
	const currentNav = subNavItems[tab];

	useEffect(() => {
		if (tab && !currentNav?.some((item) => item.route === subTab)) {
			queryParams.set({ subTab: currentNav?.[0]?.route });
		}
	}, [currentNav, queryParams, subTab, tab]);

	if (!currentNav) return null;

	return (
		<div className={cn("flex items-center gap-1 flex-wrap", menuOpen && "flex-wrap")}>
			{currentNav.map((item) => (
				<button
					key={item.route}
					onClick={() => queryParams.set({ subTab: item.route })}
					className={cn(
						"px-3 py-1.5 text-xs font-medium rounded-lg transition-all",
						subTab === item.route
							? "bg-primary text-primary-foreground shadow-sm shadow-primary/30"
							: "text-muted-foreground hover:text-foreground hover:bg-muted",
					)}>
					{item.label}
				</button>
			))}
		</div>
	);
}
