"use client";

import { X } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SideSheetProps {
	children: ReactNode;
	className?: string;
	title: string[];
	open: boolean;
	setOpen: (open: boolean) => void;
}

export default function SideSheet({ children, className, title, open, setOpen }: SideSheetProps) {
	return (
		<>
			{open && <div className="fixed inset-0 z-40 bg-black/50" onClick={() => setOpen(false)} />}
			<div
				className={cn(
					"fixed right-0 top-0 z-50 h-full w-full max-w-md border-l bg-card shadow-xl transition-transform duration-300",
					open ? "translate-x-0" : "translate-x-full",
					className,
				)}>
				<div className="flex items-center justify-between border-b px-4 py-3">
					<h2 className="text-lg font-semibold">
						{title[0]} <span className="text-muted-foreground">{title[1]}</span>
					</h2>
					<Button size="xs" variant="ghost" onClick={() => setOpen(false)}>
						<X className="h-4 w-4" />
					</Button>
				</div>
				<div className="overflow-auto p-4">{children}</div>
			</div>
		</>
	);
}
