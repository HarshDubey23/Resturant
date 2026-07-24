"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ShieldCheck, X } from "lucide-react";

const STORAGE_KEY = "ow_cookie_consent";
const AUTO_DISMISS_MS = 8_000;

/**
 * GDPR / privacy-compliant cookie consent banner.
 *
 * Round 6 redesign: positioned as a compact bottom-RIGHT toast so it
 * never covers the hero CTAs, stats, or primary content. Auto-dismisses
 * after 8s with "essential" consent. Persisted via localStorage.
 */
export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return !localStorage.getItem(STORAGE_KEY);
  });

  const handleAccept = () => {
    try { localStorage.setItem(STORAGE_KEY, "all"); } catch { /* ignore */ }
    setVisible(false);
  };

  const handleEssential = () => {
    try { localStorage.setItem(STORAGE_KEY, "essential"); } catch { /* ignore */ }
    setVisible(false);
  };

  // Auto-dismiss after AUTO_DISMISS_MS — defaults to "essential" consent
  useEffect(() => {
    if (!visible) return;
    const id = setTimeout(() => handleEssential(), AUTO_DISMISS_MS);
    return () => clearTimeout(id);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="cookie-consent-banner"
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.96 }}
          transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="fixed bottom-4 right-4 z-[60] w-[calc(100vw-2rem)] max-w-xs sm:bottom-6 sm:right-6"
          role="dialog"
          aria-label="Cookie consent"
          aria-live="polite"
        >
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 backdrop-blur-md p-4 shadow-2xl">
            {/* Subtle violet top accent */}
            <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 opacity-70" />

            {/* Close button — top-right */}
            <button
              type="button"
              onClick={handleEssential}
              aria-label="Dismiss cookie banner (essential only)"
              className="absolute top-2.5 right-2.5 flex h-6 w-6 items-center justify-center rounded-full text-white/50 transition-all hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
            >
              <X className="h-3.5 w-3.5" />
            </button>

            {/* Icon + copy */}
            <div className="flex items-start gap-2.5 pr-6">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-white">
                  We value your privacy
                </span>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  Essential cookies keep the site working. Analytics cookies help us improve. No ads, ever.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={handleEssential}
                className="flex-1 rounded-lg border border-white/15 px-3 h-8 text-[11px] font-semibold text-white/80 hover:bg-white/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                Essential only
              </button>
              <button
                type="button"
                onClick={handleAccept}
                className="flex-1 rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-500 px-3 h-8 text-[11px] font-semibold text-white hover:shadow-lg hover:shadow-violet-600/30 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
              >
                Accept all
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
