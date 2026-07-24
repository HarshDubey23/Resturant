"use client";

import { ArrowRight, Github, Linkedin, Users } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";

interface TeamMember {
        initials: string;
        name: string;
        role: string;
        description: string;
        socials: { icon: typeof Github; href: string }[];
}

const TEAM: TeamMember[] = [
        {
                initials: "HD",
                name: "Harsh Dubey",
                role: "Founder & CEO",
                description:
                        "Visionary leader who started OrderWorder to eliminate commission-heavy food aggregators. Previously built two successful restaurant tech startups.",
                socials: [
                        { icon: Github, href: "https://github.com" },
                        { icon: Linkedin, href: "https://linkedin.com" },
                ],
        },
        {
                initials: "RK",
                name: "Ritik Kumar",
                role: "CTO",
                description:
                        "Full-stack engineer and cloud architect. Built the QR ordering engine from scratch and leads our 12-person engineering team.",
                socials: [
                        { icon: Github, href: "https://github.com" },
                        { icon: Linkedin, href: "https://linkedin.com" },
                ],
        },
        {
                initials: "AP",
                name: "Ananya Patel",
                role: "Head of Product",
                description:
                        "Former UX designer at a top Indian food delivery platform. Obsessed with making restaurant tech feel as simple as ordering from your favorite waiter.",
                socials: [
                        { icon: Github, href: "https://github.com" },
                        { icon: Linkedin, href: "https://linkedin.com" },
                ],
        },
];

export default function TeamSection() {
        const prefersReduced = useReducedMotion();

        return (
                <section id="team" className="relative overflow-hidden bg-slate-950 py-24 sm:py-32">
                        {/* Subtle violet/fuchsia gradient mesh overlay */}
                        <div
                                aria-hidden
                                className="pointer-events-none absolute inset-0 opacity-70"
                                style={{
                                        backgroundImage:
                                                "radial-gradient(60% 120% at 0% 0%, hsla(263, 70%, 50%, 0.18) 0%, transparent 55%), radial-gradient(50% 100% at 100% 0%, hsla(295, 65%, 55%, 0.14) 0%, transparent 55%), radial-gradient(70% 120% at 50% 120%, hsla(280, 60%, 50%, 0.12) 0%, transparent 60%)",
                                }}
                        />
                        {/* Top hairline gradient divider */}
                        <div
                                aria-hidden
                                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/50 to-transparent"
                        />
                        {/* Bottom hairline gradient divider */}
                        <div
                                aria-hidden
                                className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-fuchsia-500/40 to-transparent"
                        />
                        {/* Soft floating orbs for depth */}
                        <div aria-hidden className="pointer-events-none absolute -top-20 left-1/3 h-48 w-48 rounded-full bg-violet-600/10 blur-3xl" />
                        <div aria-hidden className="pointer-events-none absolute -bottom-20 right-1/3 h-52 w-52 rounded-full bg-fuchsia-600/10 blur-3xl" />

                        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                                {/* Header */}
                                <motion.div
                                        initial={{ opacity: 0, y: -8 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                 viewport={{ once: true, margin: "-40px" }}
                                        transition={{ duration: 0.4, ease: "easeOut" }}
                                        className="mb-16 text-center">
                                        {/* Eyebrow pill */}
                                        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white/90 backdrop-blur-sm">
                                                <Users className="h-3.5 w-3.5 text-violet-400" />
                                                <span>Our Team</span>
                                                <span aria-hidden className="h-1 w-1 rounded-full bg-emerald-400" />
                                        </div>
                                        {/* Heading with text-gradient span */}
                                        <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                                                The people behind{" "}
                                                <span className="text-gradient">OrderWorder</span>
                                        </h2>
                                        {/* Subtitle */}
                                        <p className="mt-4 text-lg text-slate-200 leading-relaxed max-w-2xl mx-auto">
                                                A small, passionate team building the future of restaurant technology — zero commissions, full control.
                                        </p>
                                </motion.div>

                                {/* Team cards grid */}
                                <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                                        {TEAM.map((member, i) => (
                                                <motion.div
                                                        key={member.name}
                                                        initial={{ opacity: 0, y: 24 }}
                                                        whileInView={{ opacity: 1, y: 0 }}
                                                 viewport={{ once: true, margin: "-40px" }}
                                                        transition={{
                                                                duration: 0.5,
                                                                delay: prefersReduced ? 0 : i * 0.1,
                                                                ease: "easeOut",
                                                        }}
                                                        className="group rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 text-center transition-all hover:border-violet-500/30 hover:bg-white/10">
                                                        {/* Gradient avatar placeholder */}
                                                        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 ring-1 ring-white/15 shadow-soft">
                                                                <span className="text-xl font-bold text-white">{member.initials}</span>
                                                        </div>
                                                        {/* Name */}
                                                        <h3 className="text-lg font-bold text-white">{member.name}</h3>
                                                        {/* Role badge */}
                                                        <div className="mt-1 uppercase tracking-wider text-xs text-violet-400 font-semibold">{member.role}</div>
                                                        {/* Description */}
                                                        <p className="mt-4 text-sm text-slate-200 leading-relaxed line-clamp-3">{member.description}</p>
                                                        {/* Social icons row */}
                                                        <div className="mt-5 flex justify-center gap-3">
                                                                {member.socials.map((social) => {
                                                                        const SocialIcon = social.icon;
                                                                        return (
                                                                                <a
                                                                                        key={social.href + social.icon.displayName}
                                                                                        href={social.href}
                                                                                        target="_blank"
                                                                                        rel="noopener noreferrer"
                                                                                        className="text-slate-400 transition-colors hover:text-violet-400"
                                                                                        aria-label={`${member.name} on ${social.icon.displayName ?? "social media"}`}>
                                                                                        <SocialIcon className="h-4 w-4" />
                                                                                </a>
                                                                        );
                                                                })}
                                                        </div>
                                                </motion.div>
                                        ))}
                                </div>

                                {/* Bottom CTA: Join our team */}
                                <motion.div
                                        initial={{ opacity: 0, y: 12 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                 viewport={{ once: true, margin: "-40px" }}
                                        transition={{ duration: 0.4, delay: prefersReduced ? 0 : 0.35, ease: "easeOut" }}
                                        className="mt-16 text-center">
                                        <Link
                                                href="/signup"
                                                className="group inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-violet-500/30 hover:bg-violet-600/20">
                                                Join our team
                                                <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                                        </Link>
                                </motion.div>
                        </div>
                </section>
        );
}
