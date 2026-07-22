"use client";

import { ClipboardList, ShoppingCart, User, Utensils } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface MobileNavProps {
	restaurant: string;
	tableId: string;
	onOpenCart: () => void;
}

export function MobileNav({ restaurant, tableId, onOpenCart }: MobileNavProps) {
	const pathname = usePathname();

	const menuItems = [
		{ href: `/${restaurant}/table/${tableId}`, icon: Utensils, label: "Menu" },
		{ href: `/${restaurant}/table/${tableId}`, icon: ShoppingCart, label: "Cart", onClick: onOpenCart },
		{ href: `/order`, icon: ClipboardList, label: "Orders" },
		{ href: `/order`, icon: User, label: "Profile" },
	];

	return (
		<nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur md:hidden">
			<div className="flex items-center justify-around py-2">
				{menuItems.map(({ href, icon: Icon, label, onClick }) => {
					const active = pathname === href || pathname.startsWith(href);
					return (
						<Link
							key={label}
							href={href}
							className={cn("flex flex-col items-center gap-0.5 p-2 text-xs transition-colors", active ? "text-primary" : "text-muted-foreground")}
							onClick={(e) => {
								if (onClick) {
									e.preventDefault();
									onClick();
								}
								try {
									if (navigator.vibrate) navigator.vibrate(10);
								} catch {}
							}}>
							<div className="relative">
								<Icon className="h-5 w-5" />
								{label === "Cart" ? (
									<Badge variant="destructive" className="absolute -right-2 -top-2 h-4 min-w-[1rem] px-1 text-[10px]">
										•
									</Badge>
								) : null}
							</div>
							<span>{label}</span>
						</Link>
					);
				})}
			</div>
		</nav>
	);
}

export default MobileNav;
