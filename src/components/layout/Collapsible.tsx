"use client";

import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TCollapsibleProps {
	className?: string;
	children: ReactNode;
	round?: boolean;
	expand: boolean;
	setExpand: (expand: boolean) => void;
	label: string;
	alert?: number;
}

export default function Collapsible({ className, children, round, expand, setExpand, label, alert }: TCollapsibleProps) {
	return (
		<div className={cn("overflow-hidden rounded-lg border", round && "rounded-full", expand && "", className)}>
			<button
				className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium hover:bg-muted transition-colors"
				onClick={() => setExpand(!expand)}>
				<p className="flex-1">{label}</p>
				{alert != null && (
					<span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-medium text-primary-foreground">
						{alert}
					</span>
				)}
				<ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expand && "rotate-180")} />
			</button>
			{expand && <div className="border-t px-4 py-3">{children}</div>}
		</div>
	);
}
