"use client";

import { ArrowLeft, Sparkles } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DemoNavbar() {
	const [scrolled, setScrolled] = useState(false);

	useEffect(() => {
		const onScroll = () => setScrolled(window.scrollY > 120);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	return (
		<motion.header
			initial={{ y: -80, opacity: 0 }}
			animate={{ y: 0, opacity: 1 }}
			transition={{ duration: 0.4, ease: "easeOut" }}
			className={cn(
				"fixed top-0 inset-x-0 z-50 transition-all duration-300",
				scrolled ? "bg-background/80 backdrop-blur-md border-b border-border" : "bg-transparent border-b border-transparent",
			)}>
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
				<div className="flex items-center justify-between">
					<Link href="/" className="flex items-center gap-2 group">
						<div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
							<Sparkles className="h-5 w-5 text-primary" />
						</div>
						<span className="text-lg font-bold tracking-tight text-foreground hidden sm:inline">
							Order<span className="text-primary">Worder</span>
						</span>
						<span className="ml-2 rounded-full border border-border bg-card/80 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
							Demo
						</span>
					</Link>

					<div className="flex items-center gap-2">
						<Link href="/">
							<Button variant="ghost" size="sm" className="h-9 gap-1.5 rounded-xl">
								<ArrowLeft className="h-4 w-4" />
								<span className="hidden sm:inline">Back to site</span>
							</Button>
						</Link>
						<Link href="/signup">
							<Button size="sm" className="h-9 rounded-xl">
								Start free
							</Button>
						</Link>
					</div>
				</div>
			</div>
		</motion.header>
	);
}
