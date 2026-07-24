"use client";

import { LogIn, Menu, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/base/ThemeToggle";

interface NavbarProps {
        onLoginClick: () => void;
}

const navLinks = [
        { label: "Features", href: "features" },
        { label: "How It Works", href: "how-it-works" },
        { label: "Menu", href: "menu" },
        { label: "Pricing", href: "pricing" },
        { label: "FAQ", href: "faq" },
        { label: "Demo", href: "/demo?tab=menu", isLink: true },
];

export default function Navbar({ onLoginClick }: NavbarProps) {
        const [open, setOpen] = useState(false);
        const [scrolled, setScrolled] = useState(false);
        const [activeSection, setActiveSection] = useState<string>("");

        useEffect(() => {
                const onScroll = () => setScrolled(window.scrollY > 12);
                onScroll();
                window.addEventListener("scroll", onScroll, { passive: true });
                return () => window.removeEventListener("scroll", onScroll);
        }, []);

        // Track which section is currently in view for active nav highlighting
        useEffect(() => {
                const sectionIds = navLinks.filter((l) => !l.isLink).map((l) => l.href);
                const onScroll = () => {
                        let bestId = "";
                        let bestRatio = 0;
                        sectionIds.forEach((id) => {
                                const el = document.getElementById(id);
                                if (!el) return;
                                const rect = el.getBoundingClientRect();
                                const windowH = window.innerHeight;
                                const visibleTop = Math.max(0, rect.top);
                                const visibleBottom = Math.min(windowH, rect.bottom);
                                const ratio = (visibleBottom - visibleTop) / windowH;
                                if (ratio > bestRatio) {
                                        bestRatio = ratio;
                                        bestId = id;
                                }
                        });
                        setActiveSection(bestId);
                };

                onScroll();
                window.addEventListener("scroll", onScroll, { passive: true });
                return () => window.removeEventListener("scroll", onScroll);
        }, []);

        const scrollTo = (id: string) => {
                document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
                setOpen(false);
        };

        return (
                <header className="fixed top-0 left-0 right-0 z-50">
                        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                                <div
                                        className={`rounded-b-2xl px-6 transition-all duration-300 ease-out ${
                                                scrolled
                                                        ? "bg-white/80 backdrop-blur-xl border-b border-violet-100 shadow-soft"
                                                        : "glass"
                                        }`}>
                                        <div className="flex items-center justify-between h-16 sm:h-20">
                                                {/* Logo */}
                                                <button onClick={() => scrollTo("hero")} className="flex items-center gap-2 group">
                                                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-soft group-hover:scale-105 transition-all duration-200 ease-out">
                                                                <Sparkles className="h-5 w-5 text-white" />
                                                        </div>
                                                        <span className="text-xl font-bold tracking-tight text-slate-900">
                                                                Order<span className="text-violet-600">Worder</span>
                                                        </span>
                                                        {/* Beta badge */}
                                                        <span className="ml-1 inline-flex items-center gap-1 rounded-full bg-violet-600/10 border border-violet-600/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-violet-700">
                                                                Beta
                                                        </span>
                                                </button>

                                                {/* Desktop Nav */}
                                                <nav className="hidden md:flex items-center gap-1">
                                                        {navLinks.map((item) =>
                                                                (item as { isLink?: boolean }).isLink ? (
                                                                        <a
                                                                                key={item.label}
                                                                                href={item.href}
                                                                                className="group relative px-4 py-2 text-sm text-slate-600 hover:text-slate-900 rounded-xl transition-colors duration-200">
                                                                                {item.label}
                                                                                <span className="absolute left-4 right-4 -bottom-0.5 h-px w-0 bg-violet-600 transition-all duration-300 group-hover:w-[calc(100%-2rem)]" />
                                                                        </a>
                                                                ) : (
                                                                        <button
                                                                                key={item.label}
                                                                                onClick={() => scrollTo(item.href)}
                                                                                className={`group relative px-4 py-2 text-sm rounded-xl transition-all duration-200 ${
                                                                                        activeSection === item.href
                                                                                                ? "text-violet-700 font-semibold bg-violet-50/60"
                                                                                                : "text-slate-600 hover:text-slate-900 hover:bg-violet-50/30"
                                                                                }`}>
                                                                                {item.label}
                                                                                {activeSection === item.href && (
                                                                                        <motion.span
                                                                                                layoutId="nav-active-bar"
                                                                                                className="absolute left-4 right-4 -bottom-0.5 h-0.5 bg-violet-600 rounded-full"
                                                                                                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                                                                                        />
                                                                                )}
                                                                                {activeSection !== item.href && (
                                                                                        <span className="absolute left-4 right-4 -bottom-0.5 h-px w-0 bg-violet-600 transition-all duration-300 group-hover:w-[calc(100%-2rem)]" />
                                                                                )}
                                                                        </button>
                                                                ),
                                                        )}
                                                        <div className="w-px h-6 bg-slate-200 mx-2" />
                                                        <a
                                                                href="/signup"
                                                                className="text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors duration-200 px-3 py-2">
                                                                Get Started
                                                        </a>
                                                        <ThemeToggle compact />
                                                        <Button
                                                                size="sm"
                                                                onClick={onLoginClick}
                                                                className="gap-1.5 rounded-xl h-9 px-5 bg-gradient-to-r from-violet-600 to-fuchsia-500 shadow-soft hover:shadow-soft-hover hover:scale-105 transition-all duration-300">
                                                                <LogIn className="h-3.5 w-3.5" />
                                                                Sign In
                                                        </Button>
                                                </nav>

                                                {/* Mobile toggle */}
                                                <div className="md:hidden flex items-center gap-1">
                                                        <ThemeToggle compact />
                                                        <button
                                                                className="p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-all duration-200 ease-out"
                                                                onClick={() => setOpen(!open)}
                                                                aria-label={open ? "Close menu" : "Open menu"}>
                                                                {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                                                        </button>
                                                </div>
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
                                                transition={{ duration: 0.25, ease: "easeOut" }}
                                                className="md:hidden fixed inset-x-0 top-20 z-40 mx-4">
                                                <div className="glass rounded-2xl p-6 shadow-soft-hover">
                                                        <nav className="flex flex-col gap-2">
                                                                {navLinks.map((item) =>
                                                                        (item as { isLink?: boolean }).isLink ? (
                                                                                <a
                                                                                        key={item.label}
                                                                                        href={item.href}
                                                                                        className="text-left px-4 py-3 text-base text-slate-600 hover:text-slate-900 hover:bg-violet-600/5 rounded-xl transition-all duration-200">
                                                                                        {item.label}
                                                                                </a>
                                                                        ) : (
                                                                                <button
                                                                                        key={item.label}
                                                                                        onClick={() => scrollTo(item.href)}
                                                                                        className={`text-left px-4 py-3 text-base rounded-xl transition-all duration-200 ${
                                                                                                activeSection === item.href
                                                                                                        ? "text-violet-700 bg-violet-50/60 font-semibold"
                                                                                                        : "text-slate-600 hover:text-slate-900 hover:bg-violet-600/5"
                                                                                        }`}>
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
                                                                <div className="flex items-center justify-between gap-3 mt-2">
                                                                        <span className="px-4 text-sm text-slate-600">Appearance</span>
                                                                        <ThemeToggle />
                                                                </div>
                                                                <Button size="lg" className="mt-2 rounded-xl gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-500" onClick={onLoginClick}>
                                                                        <LogIn className="h-4 w-4" />
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
