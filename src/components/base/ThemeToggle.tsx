"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useIsClient } from "@/lib/use-is-client";

/**
 * Dark / light theme toggle.
 *
 * Uses next-themes (configured in the root layout). Renders a placeholder
 * on the server to avoid hydration mismatches; the real toggle mounts
 * after the first client paint via `useIsClient` (uses
 * `useSyncExternalStore` so it doesn't trigger the
 * `react-hooks/set-state-in-effect` rule).
 *
 * Honors `prefers-reduced-motion` indirectly via motion's default
 * behavior (animations are short, simple crossfades).
 */
export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
        const { theme, setTheme, resolvedTheme } = useTheme();
        const mounted = useIsClient();

        if (!mounted) {
                // Placeholder to prevent layout shift before hydration.
                return (
                        <span
                                aria-hidden
                                className={`inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white ${
                                        compact ? "h-9 w-9" : "h-10 w-10"
                                }`}
                        />
                );
        }

        const isDark = (resolvedTheme ?? theme) === "dark";
        const toggle = () => setTheme(isDark ? "light" : "dark");

        return (
                <button
                        type="button"
                        onClick={toggle}
                        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
                        className={`group relative inline-flex items-center justify-center rounded-xl border transition-all duration-200 ${
                                isDark
                                        ? "border-violet-500/30 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 hover:border-violet-500/50"
                                        : "border-slate-200 bg-white text-slate-600 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-600"
                        } ${compact ? "h-9 w-9" : "h-10 w-10"} focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-300/40`}
                >
                        <AnimatePresence mode="wait" initial={false}>
                                {isDark ? (
                                        <motion.span
                                                key="sun"
                                                initial={{ rotate: -90, opacity: 0 }}
                                                animate={{ rotate: 0, opacity: 1 }}
                                                exit={{ rotate: 90, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="absolute"
                                        >
                                                <Sun className="h-[18px] w-[18px]" />
                                        </motion.span>
                                ) : (
                                        <motion.span
                                                key="moon"
                                                initial={{ rotate: 90, opacity: 0 }}
                                                animate={{ rotate: 0, opacity: 1 }}
                                                exit={{ rotate: -90, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="absolute"
                                        >
                                                <Moon className="h-[18px] w-[18px]" />
                                        </motion.span>
                                )}
                        </AnimatePresence>
                </button>
        );
}
