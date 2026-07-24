"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";

interface PartnerLogo {
        name: string;
        short: string;
        dot: string;
        iconLetter: string;
}

const PARTNERS: PartnerLogo[] = [
        { name: "Empire Restaurant", short: "Empire", dot: "bg-violet-600", iconLetter: "E" },
        { name: "Brewpoint Cafe", short: "Brewpoint", dot: "bg-fuchsia-500", iconLetter: "B" },
        { name: "Spice Route", short: "SpiceRoute", dot: "bg-violet-500", iconLetter: "S" },
        { name: "The Curry House", short: "CurryHouse", dot: "bg-purple-500", iconLetter: "C" },
        { name: "Masala Junction", short: "Masala", dot: "bg-fuchsia-600", iconLetter: "M" },
        { name: "Royal Dining", short: "Royal", dot: "bg-violet-600", iconLetter: "R" },
        { name: "Urban Tadka", short: "UrbanTadka", dot: "bg-purple-600", iconLetter: "U" },
        { name: "Green Bowl", short: "GreenBowl", dot: "bg-violet-500", iconLetter: "G" },
        { name: "Punjab Grill", short: "Punjab", dot: "bg-fuchsia-500", iconLetter: "P" },
        { name: "Dosa Palace", short: "Dosa", dot: "bg-violet-600", iconLetter: "D" },
        { name: "Hyderabad House", short: "HydHouse", dot: "bg-purple-500", iconLetter: "H" },
        { name: "Mumbai Diner", short: "Mumbai", dot: "bg-fuchsia-600", iconLetter: "M" },
];

function PartnerCard({ partner }: { partner: PartnerLogo }) {
        return (
                <div className="group h-24 w-[180px] shrink-0 flex items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 transition-all duration-300 hover:border-violet-300 hover:bg-violet-50/40 hover:shadow-soft-hover hover:-translate-y-1 hover:ring-2 hover:ring-violet-200/40">
                        <div className="flex items-center gap-2.5 min-w-0 justify-center">
                                <span
                                        aria-hidden
                                        className={"h-1.5 w-1.5 shrink-0 rounded-full " + partner.dot + " opacity-60 transition-all duration-300 group-hover:opacity-100 group-hover:scale-150"}
                                />
                                <span
                                        title={partner.name}
                                        className="text-sm font-bold tracking-tight text-slate-800 leading-tight text-center whitespace-nowrap transition-colors duration-300 group-hover:text-violet-700">
                                        {partner.short}
                                </span>
                        </div>
                </div>
        );
}

export default function PartnersStripSection() {
        const prefersReduced = useReducedMotion();

        return (
                <section id="partners" className="border-y border-slate-100 bg-white py-16 sm:py-20">
                        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                                {/* Eyebrow */}
                                <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-40px" }}
                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                        className="mb-8 flex flex-col items-center gap-3 sm:mb-10">
                                        <div className="inline-flex items-center gap-2 text-center text-sm font-semibold uppercase tracking-wider text-slate-500">
                                                <Building2 className="h-4 w-4 text-violet-500" aria-hidden />
                                                <span>Trusted by restaurants across India</span>
                                        </div>
                                </motion.div>

                                {/* Static grid for mobile */}
                                <div className="grid grid-cols-2 gap-3 sm:hidden">
                                        {PARTNERS.slice(0, 8).map((partner, index) => (
                                                <motion.div
                                                        key={partner.name}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        whileInView={{ opacity: 1, y: 0 }}
                                                        viewport={{ once: true, margin: "-30px" }}
                                                        transition={{
                                                                duration: 0.45,
                                                                delay: prefersReduced ? 0 : index * 0.08,
                                                                ease: "easeOut",
                                                        }}
                                                        className="group h-20 flex items-center justify-center rounded-xl border border-slate-200/80 bg-white/80 px-2 transition-all duration-300 hover:border-violet-300 hover:bg-violet-50/40 hover:shadow-soft-hover">
                                                        <div className="flex items-center gap-1 sm:gap-2 min-w-0 justify-center">
                                                                <span
                                                                        aria-hidden
                                                                        className={"h-1.5 w-1.5 shrink-0 rounded-full " + partner.dot + " opacity-60 transition-all duration-300 group-hover:opacity-100 group-hover:scale-150"}
                                                                />
                                                                <span
                                                                        title={partner.name}
                                                                        className="text-[10px] font-bold tracking-tight text-slate-800 leading-tight text-center whitespace-nowrap transition-colors duration-300 group-hover:text-violet-700">
                                                                        {partner.short}
                                                                </span>
                                                        </div>
                                                </motion.div>
                                        ))}
                                </div>

                                {/* Marquee for desktop */}
                                <div className="hidden sm:block overflow-hidden relative">
                                        {/* Fade edges */}
                                        <div className="absolute left-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-r from-white to-transparent pointer-events-none" />
                                        <div className="absolute right-0 top-0 bottom-0 w-20 z-10 bg-gradient-to-l from-white to-transparent pointer-events-none" />

                                        {/* Marquee track */}
                                        <motion.div
                                                className="flex gap-4"
                                                animate={prefersReduced ? {} : { x: ["0%", "-50%"] }}
                                                transition={{
                                                        duration: 30,
                                                        repeat: Infinity,
                                                        ease: "linear",
                                                }}>
                                                {/* First set */}
                                                {PARTNERS.map((partner) => (
                                                        <PartnerCard key={`a-${partner.name}`} partner={partner} />
                                                ))}
                                                {/* Duplicate set for seamless loop */}
                                                {PARTNERS.map((partner) => (
                                                        <PartnerCard key={`b-${partner.name}`} partner={partner} />
                                                ))}
                                        </motion.div>
                                </div>

                                {/* CTA */}
                                <motion.div
                                        initial={{ opacity: 0, y: 12 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-40px" }}
                                        transition={{ duration: 0.45, delay: prefersReduced ? 0 : 0.4, ease: "easeOut" }}
                                        className="mt-10 flex justify-center sm:mt-12">
                                        <Link
                                                href="/signup"
                                                className="group inline-flex items-center gap-1.5 text-sm font-semibold text-violet-700 transition-colors hover:text-violet-800">
                                                <span>Join 500+ restaurants growing with OrderWorder</span>
                                                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                                        </Link>
                                </motion.div>
                        </div>
                </section>
        );
}
