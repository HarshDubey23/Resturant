"use client";

import { ChefHat, Clock, CreditCard, QrCode, Receipt, ShoppingCart, UserPlus } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

const steps = [
        {
                icon: UserPlus,
                title: "Register",
                description: "Restaurant signs up, sets up profile, adds tables & menu",
                gradient: "from-violet-500 to-violet-600",
                number: "01",
        },
        {
                icon: QrCode,
                title: "Get QR Codes",
                description: "Unique QR codes generated for every table. Print & place.",
                gradient: "from-violet-600 to-fuchsia-500",
                number: "02",
        },
        {
                icon: ShoppingCart,
                title: "Customer Orders",
                description: "Scan → Browse → Customize (spice, notes) → Add to cart",
                gradient: "from-fuchsia-500 to-purple-500",
                number: "03",
        },
        {
                icon: ChefHat,
                title: "Kitchen Prepares",
                description: "Real-time order with sound alert. Accept, cook, mark ready.",
                gradient: "from-purple-500 to-violet-600",
                number: "04",
        },
        {
                icon: Receipt,
                title: "Pay & Enjoy!",
                description: "Pay online or at counter. Get digital bill. Food served!",
                gradient: "from-emerald-500 to-teal-500",
                number: "05",
        },
];

export default function HowItWorksSection() {
        const prefersReduced = useReducedMotion();
        return (
                <section id="how-it-works" className="relative pt-20 pb-28 sm:pt-20 sm:pb-36 bg-white overflow-hidden">
                        {/* Subtle radial gradient at the section center */}
                        <div
                                aria-hidden
                                className="absolute inset-0 pointer-events-none"
                                style={{
                                        background:
                                                "radial-gradient(60% 50% at 50% 50%, hsla(263, 70%, 50%, 0.06) 0%, transparent 70%)",
                                }}
                        />

                        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                                <motion.div
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-100px" }}
                                        transition={{ duration: 0.6, ease: "easeOut" }}
                                        className="text-center mb-20">
                                        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
                                                How it <span className="text-gradient">works</span>
                                        </h2>
                                        <p className="mt-6 text-lg text-slate-700 max-w-2xl mx-auto leading-relaxed">
                                                From restaurant registration to food served — in 5 simple steps.
                                        </p>
                                </motion.div>

                                <div className="relative">
                                        {/* Connecting dashed line — horizontal on desktop */}
                                        <div className="hidden lg:block absolute top-10 left-[8%] right-[8%] -translate-y-1/2 pointer-events-none z-0">
                                                <div
                                                        className="h-0 w-full border-t-2 border-dashed border-violet-300"
                                                        style={{ maskImage: "linear-gradient(to right, transparent, black 6%, black 94%, transparent)" }}
                                                />
                                        </div>
                                        {/* Connecting dashed line — vertical on mobile */}
                                        <div className="lg:hidden absolute top-0 bottom-0 left-10 -translate-x-1/2 pointer-events-none z-0">
                                                <div
                                                        className="w-0 h-full border-l-2 border-dashed border-violet-300"
                                                        style={{ maskImage: "linear-gradient(to bottom, transparent, black 5%, black 95%, transparent)" }}
                                                />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 md:gap-4 lg:gap-2 relative z-10">
                                                {steps.map((step, index) => {
                                                        const Icon = step.icon;
                                                        return (
                                                                <motion.div
                                                                        key={step.title}
                                                                        initial={{ opacity: 0, y: 30 }}
                                                                        whileInView={{ opacity: 1, y: 0 }}
                                                                        viewport={{ once: true, margin: "-50px" }}
                                                                        transition={{
                                                                                duration: 0.5,
                                                                                delay: prefersReduced ? 0 : index * 0.12,
                                                                                ease: "easeOut",
                                                                        }}
                                                                        className="relative flex flex-col items-center text-center group">
                                                                        {/* Step number badge with gradient border — pops above the card */}
                                                                        <div className="relative z-20 mb-[-2.5rem]">
                                                                                <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-violet-600 opacity-95 shadow-lg shadow-violet-500/30" />
                                                                                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-soft group-hover:shadow-soft-hover transition-all duration-300 ease-out">
                                                                                        <div
                                                                                                className={`absolute inset-1 rounded-full bg-gradient-to-br ${step.gradient} opacity-10 group-hover:opacity-20 transition-opacity duration-300`}
                                                                                        />
                                                                                        <Icon className="h-8 w-8 text-violet-600 relative z-10 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6" />
                                                                                </div>
                                                                                {/* Small floating number badge */}
                                                                                <div className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-500 text-[10px] font-bold text-white shadow-soft ring-2 ring-white">
                                                                                        {step.number}
                                                                                </div>
                                                                                {/* Hover glow ring */}
                                                                                <div
                                                                                        aria-hidden
                                                                                        className="absolute -inset-3 rounded-full bg-violet-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                                                                />
                                                                        </div>

                                                                        {/* Step card body — wraps title + description as one cohesive card */}
                                                                        <div className="relative w-full rounded-2xl border border-slate-200 bg-white px-5 pt-12 pb-5 shadow-soft transition-all duration-300 ease-out group-hover:shadow-soft-hover group-hover:-translate-y-1 group-hover:border-violet-200">
                                                                                <h3 className="text-base font-bold text-slate-900 mb-2 tracking-tight">{step.title}</h3>
                                                                                <p className="text-sm text-slate-700 leading-relaxed">{step.description}</p>
                                                                        </div>
                                                                </motion.div>
                                                        );
                                                })}
                                        </div>
                                </div>

                                {/* Floating "Total time" badge */}
                                <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-80px" }}
                                        transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
                                        className="mt-16 flex justify-center">
                                        <div className="inline-flex items-center gap-2.5 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-soft ring-1 ring-emerald-400/50">
                                                <Clock className="h-4 w-4 text-white" />
                                                Total time: ~10 minutes
                                                <span className="ml-1 inline-flex h-1.5 w-1.5 rounded-full bg-white/80 animate-pulse" aria-hidden />
                                        </div>
                                </motion.div>
                        </div>
                </section>
        );
}
