"use client";

import { Menu, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface NavbarProps {
	onLoginClick: () => void;
}

const navLinks = [
	{ label: "Features", href: "features" },
	{ label: "How It Works", href: "how-it-works" },
	{ label: "Testimonials", href: "testimonials" },
	{ label: "Pricing", href: "pricing" },
	{ label: "Demo", href: "/demo", isLink: true },
];

export default function Navbar({ onLoginClick }: NavbarProps) {
	const [open, setOpen] = useState(false);

	const scrollTo = (id: string) => {
		document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
		setOpen(false);
	};

	return (
		<header className="fixed top-0 left-0 right-0 z-50">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<div className="glass rounded-b-2xl px-6">
					<div className="flex items-center justify-between h-16 sm:h-20">
						{/* Logo */}
						<button onClick={() => scrollTo("homepage")} className="flex items-center gap-2 group">
							<div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
								<Sparkles className="h-5 w-5 text-primary" />
							</div>
							<span className="text-xl font-bold tracking-tight text-foreground">
								Order<span className="text-primary">Worder</span>
							</span>
						</button>

						{/* Desktop Nav */}
						<nav className="hidden md:flex items-center gap-1">
							{navLinks.map((item) =>
								(item as { isLink?: boolean }).isLink ? (
									<a
										key={item.label}
										href={item.href}
										className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-primary/5 rounded-lg transition-all duration-200">
										{item.label}
									</a>
								) : (
									<button
										key={item.label}
										onClick={() => scrollTo(item.href)}
										className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-primary/5 rounded-lg transition-all duration-200">
										{item.label}
									</button>
								),
							)}
							<div className="w-px h-6 bg-border mx-2" />
							<a href="/signup" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors px-3 py-2">
								Get Started
							</a>
							<Button size="sm" onClick={onLoginClick} className="rounded-lg h-9 px-5">
								Sign In
							</Button>
						</nav>

						{/* Mobile toggle */}
						<button
							className="md:hidden p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/50 transition-colors"
							onClick={() => setOpen(!open)}
							aria-label={open ? "Close menu" : "Open menu"}>
							{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
						</button>
					</div>
				</div>
			</div>

			{/* Mobile Menu */}
			<AnimatePresence>
				{open && (
					<motion.div
						initial={{ opacity: 0, y: -10 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -10 }}
						transition={{ duration: 0.2 }}
						className="md:hidden fixed inset-x-0 top-20 z-40 mx-4">
						<div className="glass rounded-2xl p-6 shadow-xl">
							<nav className="flex flex-col gap-2">
								{navLinks.map((item) =>
									(item as { isLink?: boolean }).isLink ? (
										<a
											key={item.label}
											href={item.href}
											className="text-left px-4 py-3 text-base text-muted-foreground hover:text-foreground hover:bg-primary/5 rounded-xl transition-colors">
											{item.label}
										</a>
									) : (
										<button
											key={item.label}
											onClick={() => scrollTo(item.href)}
											className="text-left px-4 py-3 text-base text-muted-foreground hover:text-foreground hover:bg-primary/5 rounded-xl transition-colors">
											{item.label}
										</button>
									),
								)}
								<hr className="my-2 border-border" />
								<a href="/signup" className="px-4 py-3 text-base font-semibold text-primary hover:bg-primary/5 rounded-xl transition-colors">
									Get Started
								</a>
								<Button size="lg" className="mt-2 rounded-xl" onClick={onLoginClick}>
									Sign In
								</Button>
							</nav>
						</div>
					</motion.div>
				)}
			</AnimatePresence>
		</header>
	);
}
