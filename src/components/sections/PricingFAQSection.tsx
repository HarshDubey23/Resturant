"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, HelpCircle } from "lucide-react";

interface PricingFaqItem {
        question: string;
        answer: string;
}

const PRICING_FAQS: PricingFaqItem[] = [
        {
                question: "Is there really a free plan?",
                answer:
                        "Yes! Our Starter plan is completely free forever — no credit card, no time limit. It includes up to 5 tables, basic QR ordering, and GST billing. Upgrade whenever you need more tables or advanced features.",
        },
        {
                question: "What happens when I exceed my table limit?",
                answer:
                        "You'll get a gentle notification in your dashboard. Nothing breaks — orders keep flowing. When you're ready, upgrade to the next plan with one click. No penalties, no surprise charges.",
        },
        {
                question: "Do I pay commission on orders?",
                answer:
                        "Absolutely not. OrderWorder charges zero commission on every order. You keep 100% of your revenue. That's our founding principle — restaurants deserve to own their income.",
        },
        {
                question: "Can I switch plans anytime?",
                answer:
                        "Yes. Upgrade or downgrade at any time from your dashboard. When you upgrade, the new rate starts immediately. When you downgrade, it applies at the next billing cycle. No lock-in contracts.",
        },
        {
                question: "Is there a setup fee?",
                answer:
                        "No setup fee, ever. Register your restaurant, upload your menu, print your QR codes — that's it. Most restaurants are live within 15 minutes. Our support team is available 24/7 if you need help.",
        },
        {
                question: "What payment methods do you accept?",
                answer:
                        "We accept UPI, credit/debit cards (Visa, Mastercard, RuPay), net banking, and international cards. All payments are processed securely through Razorpay with PCI-DSS compliance.",
        },
];

function PricingFaqCard({ item, index }: { item: PricingFaqItem; index: number }) {
        const prefersReduced = useReducedMotion();
        const [isOpen, setIsOpen] = useState(false);

        return (
                <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-50px" }}
                        transition={{
                                duration: 0.45,
                                delay: prefersReduced ? 0 : index * 0.07,
                                ease: "easeOut",
                        }}
                        className={`group rounded-2xl border bg-white shadow-soft-hover transition-all duration-200 ease-out overflow-hidden ${
                                isOpen
                                        ? "border-l-[3px] border-l-violet-500 border-slate-200 bg-violet-50/20"
                                        : "border-slate-200 hover:bg-violet-50/50"
                        }`}>
                        <button
                                type="button"
                                onClick={() => setIsOpen((v) => !v)}
                                aria-expanded={isOpen}
                                className="flex w-full items-start gap-3 px-6 py-5 text-left transition-colors duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/40">
                                <span className="flex-1 text-sm font-semibold text-slate-900 leading-snug">
                                        {item.question}
                                </span>
                                <motion.span
                                 animate={{ rotate: isOpen ? 180 : 0 }}
                                        transition={{ duration: 0.25, ease: "easeOut" }}
                                        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full transition-colors duration-200 ${
                                                isOpen
                                                        ? "bg-violet-600 text-white"
                                                        : "bg-violet-100 text-violet-600 group-hover:bg-violet-200"
                                        }`}>
                                        <ChevronDown className="h-3.5 w-3.5" />
                                </motion.span>
                        </button>

                        <AnimatePresence initial={false}>
                                {isOpen && (
                                        <motion.div
                                                key="answer"
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.3, ease: "easeInOut" }}
                                                className="overflow-hidden">
                                                <div className="pt-3 pb-4 px-6">
                                                        <p className="text-sm text-slate-600 leading-relaxed">
                                                                {item.answer}
                                                        </p>
                                                </div>
                                        </motion.div>
                                )}
                        </AnimatePresence>
                </motion.div>
        );
}

export default function PricingFAQSection() {
        const prefersReduced = useReducedMotion();

        return (
                <section id="pricing-faq" className="relative py-20 sm:py-24 bg-white overflow-hidden">
                        {/* Subtle violet dot pattern overlay */}
                        <div
                                aria-hidden
                                className="absolute inset-0 pointer-events-none opacity-[0.3]"
                                style={{
                                        backgroundImage:
                                                "radial-gradient(circle, hsla(263, 70%, 50%, 0.12) 1px, transparent 1px)",
                                        backgroundSize: "32px 32px",
                                }}
                        />

                        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                                {/* Header */}
                                <motion.div
                                        initial={{ opacity: 0, y: 24 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-100px" }}
                                        transition={{ duration: 0.5, ease: "easeOut" }}
                                        className="text-center mb-12 sm:mb-14">
                                        <div className="inline-flex items-center gap-2 rounded-full border border-violet-200/60 bg-violet-50/80 px-4 py-1.5 text-sm text-violet-700 mb-6 shadow-soft-hover">
                                                <HelpCircle className="h-3.5 w-3.5" />
                                                Pricing FAQ
                                        </div>
                                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                                                Common pricing questions
                                        </h2>
                                        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                                                Everything you need to know before you start
                                        </p>
                                </motion.div>

                                {/* 2-column FAQ grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="space-y-6">
                                                {PRICING_FAQS.slice(0, 3).map((item, i) => (
                                                        <PricingFaqCard key={item.question} item={item} index={i} />
                                                ))}
                                        </div>
                                        <div className="space-y-6">
                                                {PRICING_FAQS.slice(3).map((item, i) => (
                                                        <PricingFaqCard key={item.question} item={item} index={i + 3} />
                                                ))}
                                        </div>
                                </div>
                        </div>
                </section>
        );
}
