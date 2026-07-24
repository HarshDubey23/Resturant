"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, HelpCircle, ThumbsDown, ThumbsUp } from "lucide-react";
import { toast } from "sonner";

interface FaqItem {
        question: string;
        answer: string;
}

const FAQS: FaqItem[] = [
        {
                question: "Do customers need to download an app?",
                answer:
                        "No. Customers scan a QR code at their table and the menu opens in their phone's browser instantly. No download, no login required.",
        },
        {
                question: "How long does setup take?",
                answer:
                        "Most restaurants are live in under 10 minutes. Add your menu, generate QR codes for each table, print and place them — you're ready.",
        },
        {
                question: "What payment methods are supported?",
                answer:
                        "Razorpay and Stripe are integrated out of the box. Customers can pay via UPI, credit/debit cards, wallets, and net banking.",
        },
        {
                question: "Can I customize the menu after going live?",
                answer:
                        "Yes. Update items, prices, photos, and availability anytime from your dashboard. Changes reflect instantly on the QR menu.",
        },
        {
                question: "Is my data safe?",
                answer:
                        "Yes. All data is encrypted in transit and at rest. Bills are tamper-proof via hash-chain audit logging. We never sell your data.",
        },
        {
                question: "Do you charge per-order commission?",
                answer:
                        "No. Unlike food delivery apps, we charge a flat monthly subscription. Keep 100% of every order.",
        },
        {
                question: "What if internet goes down?",
                answer:
                        "The kitchen display and cashier work offline. Orders sync automatically when connection returns. No lost tickets.",
        },
        {
                question: "Can I use my existing POS?",
                answer:
                        "Yes. OrderWorder exports daily sales as CSV and integrates with popular POS systems via API. Talk to us for custom integrations.",
        },
];

type FeedbackState = "none" | "helpful" | "unhelpful";

type FaqItemCardProps = {
        item: FaqItem;
        index: number;
        total: number;
        registerRef: (el: HTMLButtonElement | null) => void;
        onNavigate: (targetIndex: number) => void;
};

function FaqItemCard({ item, index, total, registerRef, onNavigate }: FaqItemCardProps) {
        const prefersReduced = useReducedMotion();
        const [isOpen, setIsOpen] = useState(false);
        const [feedback, setFeedback] = useState<FeedbackState>("none");
        const [submitting, setSubmitting] = useState(false);

        async function handleFeedback(helpful: boolean) {
                if (submitting || feedback !== "none") return;
                setSubmitting(true);
                try {
                        const res = await fetch("/api/faq-feedback", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ question: item.question, helpful }),
                        });
                        if (!res.ok) throw new Error("Request failed");
                        setFeedback(helpful ? "helpful" : "unhelpful");
                        toast.success(helpful ? "Thanks for the feedback!" : "Got it — we'll improve this answer.");
                } catch {
                        toast.error("Couldn't submit feedback. Please try again.");
                } finally {
                        setSubmitting(false);
                }
        }

        function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
                switch (e.key) {
                        case "ArrowDown":
                                e.preventDefault();
                                onNavigate(index + 1);
                                break;
                        case "ArrowUp":
                                e.preventDefault();
                                onNavigate(index - 1);
                                break;
                        case "Home":
                                e.preventDefault();
                                onNavigate(0);
                                break;
                        case "End":
                                e.preventDefault();
                                onNavigate(total - 1);
                                break;
                        case "Escape":
                                if (isOpen) {
                                        e.preventDefault();
                                        setIsOpen(false);
                                }
                                break;
                }
        }

        return (
                <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{
                                duration: 0.45,
                                delay: prefersReduced ? 0 : index * 0.06,
                                ease: "easeOut",
                        }}
                        className={`group rounded-2xl border bg-white shadow-soft transition-all duration-200 ease-out overflow-hidden ${
                                isOpen ? "border-violet-300 border-l-[3px] border-l-violet-500 bg-slate-50/30 shadow-soft-hover" : "border-slate-100 hover:border-violet-200 hover:shadow-soft-hover"
                        }`}>
                        <button
                                type="button"
                                ref={registerRef}
                                id={`faq-question-${index}`}
                                onClick={() => setIsOpen((v) => !v)}
                                onKeyDown={handleKeyDown}
                                aria-expanded={isOpen}
                                aria-controls={`faq-panel-${index}`}
                                className="flex w-full items-start gap-3 px-5 sm:px-6 py-5 text-left transition-colors duration-150 hover:bg-violet-50/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40">
                                <span className="flex-1 text-base sm:text-lg font-semibold text-slate-900 leading-snug">
                                        {item.question}
                                </span>
                                <motion.span
                                        animate={{ rotate: isOpen ? 180 : 0 }}
                                        transition={{ duration: 0.25, ease: "easeOut" }}
                                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                                                isOpen ? "bg-violet-600 text-white" : "bg-violet-100 text-violet-700 group-hover:bg-violet-200"
                                        }`}>
                                        <ChevronDown className="h-4 w-4" />
                                </motion.span>
                        </button>

                        <AnimatePresence initial={false}>
                                {isOpen && (
                                        <motion.div
                                                key="answer"
                                                id={`faq-panel-${index}`}
                                                role="region"
                                                aria-labelledby={`faq-question-${index}`}
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                                className="overflow-hidden">
                                                <div className="px-5 sm:px-6 pb-5">
                                                        <p className="text-sm sm:text-base text-slate-700 leading-relaxed">{item.answer}</p>
                                                        <div className="mt-4 flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
                                                                <span className="text-xs font-medium text-slate-500">
                                                                        {feedback === "none" ? "Was this helpful?" : "Thanks for your feedback!"}
                                                                </span>
                                                                <div className="flex items-center gap-2">
                                                                        <button
                                                                                type="button"
                                                                                disabled={submitting || feedback !== "none"}
                                                                                onClick={() => handleFeedback(true)}
                                                                                aria-label="Mark as helpful"
                                                                                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-150 ${
                                                                                        feedback === "helpful"
                                                                                                ? "border-emerald-500 bg-emerald-500 text-white"
                                                                                                : "border-slate-200 bg-white text-slate-500 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-60 disabled:cursor-not-allowed"
                                                                                }`}>
                                                                                <ThumbsUp className="h-3.5 w-3.5" />
                                                                        </button>
                                                                        <button
                                                                                type="button"
                                                                                disabled={submitting || feedback !== "none"}
                                                                                onClick={() => handleFeedback(false)}
                                                                                aria-label="Mark as not helpful"
                                                                                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-150 ${
                                                                                        feedback === "unhelpful"
                                                                                                ? "border-amber-500 bg-amber-500 text-white"
                                                                                                : "border-slate-200 bg-white text-slate-500 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-600 disabled:opacity-60 disabled:cursor-not-allowed"
                                                                                }`}>
                                                                                <ThumbsDown className="h-3.5 w-3.5" />
                                                                        </button>
                                                                </div>
                                                        </div>
                                                </div>
                                        </motion.div>
                                )}
                        </AnimatePresence>
                </motion.div>
        );
}

export default function FAQSection() {
        const questionRefs = useRef<(HTMLButtonElement | null)[]>([]);
        const total = FAQS.length;

        const handleNavigate = (targetIndex: number) => {
                const clamped = Math.max(0, Math.min(total - 1, targetIndex));
                questionRefs.current[clamped]?.focus();
        };

        return (
                <section id="faq" className="relative py-28 sm:py-36 bg-white overflow-hidden">
                        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                                <motion.div
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-100px" }}
                                        transition={{ duration: 0.6, ease: "easeOut" }}
                                        className="text-center mb-16 sm:mb-20">
                                        <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/60 bg-violet-50/80 px-4 py-1.5 text-sm text-violet-700 mb-6 shadow-soft">
                                                <HelpCircle className="h-3.5 w-3.5" />
                                                FAQ
                                        </div>
                                        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
                                                Questions? <span className="text-gradient">We&apos;ve got answers</span>
                                        </h2>
                                        <p className="mt-6 text-lg text-slate-700 max-w-2xl mx-auto leading-relaxed">
                                                Everything you need to know about OrderWorder. Can&apos;t find what you&apos;re looking for?{" "}
                                                <a href="#login" className="text-violet-600 font-semibold hover:text-violet-700 underline-offset-4 hover:underline">
                                                        Talk to our team
                                                </a>
                                                .
                                        </p>
                                </motion.div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                        <div className="space-y-4">
                                                {FAQS.slice(0, 4).map((item, i) => (
                                                        <FaqItemCard
                                                                key={item.question}
                                                                item={item}
                                                                index={i}
                                                                total={total}
                                                                registerRef={(el) => {
                                                                        questionRefs.current[i] = el;
                                                                }}
                                                                onNavigate={handleNavigate}
                                                        />
                                                ))}
                                        </div>
                                        <div className="space-y-4">
                                                {FAQS.slice(4).map((item, i) => (
                                                        <FaqItemCard
                                                                key={item.question}
                                                                item={item}
                                                                index={i + 4}
                                                                total={total}
                                                                registerRef={(el) => {
                                                                        questionRefs.current[i + 4] = el;
                                                                }}
                                                                onNavigate={handleNavigate}
                                                        />
                                                ))}
                                        </div>
                                </div>
                        </div>
                </section>
        );
}
