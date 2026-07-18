"use client";

import { Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavbarProps {
	onLoginClick: () => void;
}

export default function Navbar({ onLoginClick }: NavbarProps) {
	const [open, setOpen] = useState(false);

	const scrollTo = (id: string) => {
		document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
		setOpen(false);
	};

	return (
		<header className="fixed top-0 left-0 right-0 z-50 px-4 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-7xl">
				<div className="flex items-center justify-between h-16 sm:h-20">
					<button onClick={() => scrollTo("homepage")} className="text-lg font-semibold tracking-tight text-foreground">
						OrderWorder
					</button>

					<nav className="hidden md:flex items-center gap-8">
						{[
							{ label: "Features", href: "features" },
							{ label: "About", href: "about" },
						].map((item) => (
							<button
								key={item.label}
								onClick={() => scrollTo(item.href)}
								className="text-sm text-muted-foreground hover:text-foreground transition-colors">
								{item.label}
							</button>
						))}
						<a href="/signup" className="text-sm font-medium text-primary hover:underline">
							Get Started
						</a>
						<Button size="sm" onClick={onLoginClick}>
							Sign In
						</Button>
					</nav>

					<button
						className="md:hidden p-2 text-muted-foreground hover:text-foreground"
						onClick={() => setOpen(!open)}
						aria-label={open ? "Close menu" : "Open menu"}>
						{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
					</button>
				</div>
			</div>

			<div className={cn("md:hidden fixed inset-0 top-16 bg-background z-40 transition-transform duration-300", open ? "translate-x-0" : "translate-x-full")}>
				<nav className="flex flex-col items-center gap-6 pt-12">
					{[
						{ label: "Features", href: "features" },
						{ label: "About", href: "about" },
					].map((item) => (
						<button key={item.label} onClick={() => scrollTo(item.href)} className="text-lg text-muted-foreground hover:text-foreground transition-colors">
							{item.label}
						</button>
					))}
					<a href="/signup" className="text-lg font-medium text-primary">
						Get Started
					</a>
					<Button size="lg" className="mt-4" onClick={onLoginClick}>
						Sign In
					</Button>
				</nav>
			</div>
		</header>
	);
}
