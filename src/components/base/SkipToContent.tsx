"use client";

/**
 * Accessibility skip-link.
 *
 * Visually hidden until the user tabs into it (keyboard users). Clicking
 * it moves focus to the main content region so screen-reader and
 * keyboard-only users can jump past the announcement bar, navbar, and
 * repeated navigation. Renders nothing on the server if window is
 * undefined (it doesn't, since this is a client component).
 *
 * Tailwind's `sr-only` keeps it off-screen, and `focus:not-sr-only`
 * brings it back into view on focus.
 */
export default function SkipToContent() {
        const handleClick = () => {
                const main = document.querySelector("main");
                if (main) {
                        // Make main focusable, then focus it.
                        (main as HTMLElement).setAttribute("tabindex", "-1");
                        (main as HTMLElement).focus({ preventScroll: false });
                        // Smooth scroll to top of main for visual context.
                        main.scrollIntoView({ behavior: "smooth", block: "start" });
                }
        };

        return (
                <a
                        href="#main-content"
                        onClick={handleClick}
                        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-xl focus:bg-violet-600 focus:px-5 focus:py-3 focus:text-sm focus:font-semibold focus:text-white focus:shadow-soft-hover focus:outline-none focus:ring-4 focus:ring-violet-300/40"
                >
                        Skip to content
                </a>
        );
}
