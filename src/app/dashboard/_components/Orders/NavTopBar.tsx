"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useQueryParams } from "#utils/hooks/useQueryParams";
import { cn } from "@/lib/utils";

interface NavTopBarProps {
  title?: string;
  menuOpen?: boolean;
  onClick?: () => void;
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
    { label: "menu", route: "menu" },
  ],
};

export default function NavTopBar({ title, menuOpen, onClick }: NavTopBarProps) {
  const queryParams = useQueryParams();
  const tab = queryParams.get("tab") ?? "";
  const subTab = queryParams.get("subTab") ?? "";
  const currentNav = subNavItems[tab];

  useEffect(() => {
    if (tab && !currentNav?.some((item) => item.route === subTab)) {
      queryParams.set({ subTab: currentNav?.[0]?.route });
    }
  }, [currentNav, queryParams, subTab, tab]);

  return (
    <div className="flex items-center gap-4 px-4 py-2 border-b bg-card" id="navBar">
      {title && (
        <Link href="/" className="text-sm font-semibold shrink-0">
          {title}
        </Link>
      )}
      <div className={cn("flex items-center gap-1", menuOpen && "flex-wrap")}>
        <button
          className="flex flex-col gap-[3px] p-1.5 rounded-md hover:bg-muted transition-colors mr-1"
          onClick={onClick}
        >
          <span className="block h-0.5 w-4 rounded-full bg-foreground" />
          <span className="block h-0.5 w-4 rounded-full bg-foreground" />
        </button>
        <div className="flex items-center gap-1">
          {currentNav?.map((item) => (
            <button
              key={item.route}
              onClick={() => queryParams.set({ subTab: item.route })}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md transition-colors",
                subTab === item.route
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
