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
	{ label: "Demo", href: "/demo?tab=menu", isLink: true },
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
							<div className="h-9 w-9 rounded-xl bg-violet-600/10 flex items-center justify-center group-hover:bg-violet-600/20 transition-all duration-200 ease-out">
								<Sparkles className="h-5 w-5 text-violet-600" />
							</div>
							<span className="text-xl font-bold tracking-tight text-slate-900">
								Order<span className="text-violet-600">Worder</span>
							</span>
						</button>

						{/* Desktop Nav */}
						<nav className="hidden md:flex items-center gap-1">
							{navLinks.map((item) =>
								(item as { isLink?: boolean }).isLink ? (
									<a
										key={item.label}
										href={item.href}
										className="px-4 py-2 text-sm text-slate-500 hover:text-slate-900 hover:bg-violet-600/5 rounded-xl transition-all duration-200 ease-out">
										{item.label}
									</a>
								) : (
									<button
										key={item.label}
										onClick={() => scrollTo(item.href)}
										className="px-4 py-2 text-sm text-slate-500 hover:text-slate-900 hover:bg-violet-600/5 rounded-xl transition-all duration-200 ease-out">
										{item.label}
									</button>
								),
							)}
							<div className="w-px h-6 bg-slate-200 mx-2" />
							<a href="/signup" className="text-sm font-semibold text-violet-600 hover:text-violet-700 transition-all duration-200 px-3 py-2">
								Get Started
							</a>
							<Button size="sm" onClick={onLoginClick} className="rounded-xl h-9 px-5">
								Sign In
							</Button>
						</nav>

						{/* Mobile toggle */}
						<button
							className="md:hidden p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-all duration-200 ease-out"
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
						<div className="glass rounded-2xl p-6 shadow-soft-hover">
							<nav className="flex flex-col gap-2">
								{navLinks.map((item) =>
									(item as { isLink?: boolean }).isLink ? (
										<a
											key={item.label}
											href={item.href}
											className="text-left px-4 py-3 text-base text-slate-500 hover:text-slate-900 hover:bg-violet-600/5 rounded-xl transition-all duration-200">
											{item.label}
										</a>
									) : (
										<button
											key={item.label}
											onClick={() => scrollTo(item.href)}
											className="text-left px-4 py-3 text-base text-slate-500 hover:text-slate-900 hover:bg-violet-600/5 rounded-xl transition-all duration-200">
											{item.label}
										</button>
									),
								)}
								<hr className="my-2 border-slate-200" />
								<a
									href="/signup"
									className="px-4 py-3 text-base font-semibold text-violet-600 hover:bg-violet-600/5 rounded-xl transition-all duration-200">
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
