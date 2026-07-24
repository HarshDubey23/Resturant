"use client";

import { motion, useReducedMotion } from "motion/react";
import { BookOpen, ArrowRight, Calendar, type LucideIcon } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

interface BlogArticle {
        id: string;
        title: string;
        category: string;
        categoryColor: string;
        date: string;
        excerpt: string;
        image: string;
        gradientFrom: string;
        gradientTo: string;
        icon: LucideIcon;
        readTime: string;
}

const ARTICLES: BlogArticle[] = [
        {
                id: "qr-ordering-revenue",
                title: "5 Ways QR Ordering Boosts Revenue by 30%",
                category: "Growth",
                categoryColor: "bg-violet-600 text-white",
                date: "Jul 2026",
                excerpt:
                        "Discover how restaurants across India are using QR ordering to increase average order value and reduce wait times.",
                image: "/blog-qr-ordering-revenue.png",
                gradientFrom: "from-violet-500",
                gradientTo: "to-fuchsia-500",
                icon: BookOpen,
                readTime: "5 min read",
        },
        {
                id: "gst-compliance-guide",
                title: "The Complete Guide to GST Compliance for Restaurants",
                category: "Compliance",
                categoryColor: "bg-emerald-600 text-white",
                date: "Jun 2026",
                excerpt:
                        "Everything you need to know about GST filing, e-invoicing, and tax compliance for your restaurant business.",
                image: "/blog-gst-compliance-guide.png",
                gradientFrom: "from-emerald-500",
                gradientTo: "to-teal-500",
                icon: BookOpen,
                readTime: "8 min read",
        },
        {
                id: "whatsapp-marketing-loyalty",
                title: "WhatsApp Marketing: From Birthday Offers to Loyalty",
                category: "Marketing",
                categoryColor: "bg-amber-500 text-white",
                date: "May 2026",
                excerpt:
                        "Learn how to set up automated WhatsApp campaigns that bring customers back without spending on ads.",
                image: "/blog-whatsapp-marketing.png",
                gradientFrom: "from-amber-400",
                gradientTo: "to-yellow-400",
                icon: BookOpen,
                readTime: "6 min read",
        },
];

export default function BlogTeaserSection() {
        const reduceMotion = useReducedMotion();

        return (
                <section id="blog" className="relative py-24 sm:py-32 bg-white overflow-hidden">
                        {/* Background decoration */}
                        <div aria-hidden className="absolute top-0 right-0 w-96 h-96 bg-violet-100/40 rounded-full blur-[120px] pointer-events-none" />
                        <div aria-hidden className="absolute bottom-0 left-0 w-64 h-64 bg-fuchsia-100/30 rounded-full blur-[80px] pointer-events-none" />

                        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                                {/* Header */}
                                <motion.div
                                        initial={{ opacity: 0, y: 24 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-80px" }}
                                        transition={{ duration: reduceMotion ? 0 : 0.6, ease: "easeOut" }}
                                        className="mx-auto max-w-2xl text-center"
                                >
                                        <span className="inline-flex items-center gap-2 rounded-full border border-violet-200/60 bg-violet-50/80 px-4 py-1.5 text-sm text-violet-700 shadow-soft">
                                                <BookOpen className="h-3.5 w-3.5" />
                                                Resources &amp; Insights
                                        </span>
                                        <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl">
                                                Latest from our <span className="text-gradient">kitchen</span>
                                        </h2>
                                        <p className="mt-4 text-base text-slate-600 sm:text-lg">
                                                Tips, trends, and success stories for restaurant owners.
                                        </p>
                                </motion.div>

                                {/* Blog Cards Grid */}
                                <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
                                        {ARTICLES.map((article, i) => {
                                                return (
                                                        <motion.div
                                                                key={article.id}
                                                                initial={{ opacity: 0, y: 24 }}
                                                                whileInView={{ opacity: 1, y: 0 }}
                                                                viewport={{ once: true, margin: "-60px" }}
                                                                transition={{
                                                                        duration: reduceMotion ? 0 : 0.5,
                                                                        delay: reduceMotion ? 0 : i * 0.1,
                                                                        ease: "easeOut",
                                                                }}
                                                                className="group rounded-2xl border border-slate-200 bg-white shadow-soft overflow-hidden hover:-translate-y-2 hover:border-violet-300 hover:shadow-soft-hover hover:ring-2 hover:ring-violet-200/50 transition-all duration-300"
                                                        >
                                                                {/* Image with overlay */}
                                                                <div className="relative aspect-[16/10] overflow-hidden">
                                                                        <Image
                                                                                src={article.image}
                                                                                alt={article.title}
                                                                                fill
                                                                                sizes="(max-width: 768px) 100vw, 33vw"
                                                                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                                                                        />
                                                                        {/* Gradient overlay */}
                                                                        <div className={`absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent group-hover:from-black/50 transition-all duration-300`} />
                                                                        {/* Category badge on image */}
                                                                        <div className="absolute top-3 left-3">
                                                                                <Badge
                                                                                        className={`${article.categoryColor} text-xs font-semibold px-2.5 py-1 rounded-full border-0 shadow-md backdrop-blur-sm`}
                                                                                >
                                                                                        {article.category}
                                                                                </Badge>
                                                                        </div>
                                                                        {/* Read time */}
                                                                        <div className="absolute bottom-3 left-3">
                                                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-soft">
                                                                                        <BookOpen className="h-3 w-3" />
                                                                                        {article.readTime}
                                                                                </span>
                                                                        </div>
                                                                </div>

                                                                {/* Card Content */}
                                                                <div className="p-5 flex flex-col gap-3">
                                                                        {/* Title */}
                                                                        <h3 className="text-lg font-bold tracking-tight text-slate-900 leading-snug group-hover:text-violet-700 transition-colors duration-200">
                                                                                {article.title}
                                                                        </h3>

                                                                        {/* Excerpt */}
                                                                        <p className="text-sm text-slate-700 line-clamp-2 leading-relaxed">
                                                                                {article.excerpt}
                                                                        </p>

                                                                        {/* Date + Read more */}
                                                                        <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100">
                                                                                <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
                                                                                        <Calendar className="h-3.5 w-3.5" />
                                                                                        {article.date}
                                                                                </span>
                                                                                <span
                                                                                        className="inline-flex items-center gap-1 text-sm font-semibold text-violet-600 group-hover:text-violet-700 transition-colors"
                                                                                >
                                                                                        Read more
                                                                                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                                                                                </span>
                                                                        </div>
                                                                </div>
                                                        </motion.div>
                                                );
                                        })}
                                </div>

                                {/* View all articles CTA */}
                                <motion.div
                                        initial={{ opacity: 0 }}
                                        whileInView={{ opacity: 1 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: reduceMotion ? 0 : 0.4, delay: reduceMotion ? 0 : 0.3 }}
                                        className="mt-10 text-center"
                                >
                                        <Link
                                                href="/blog"
                                                className="group inline-flex items-center gap-2 text-sm font-semibold text-violet-600 hover:text-violet-700 transition-colors"
                                        >
                                                View all articles
                                                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                        </Link>
                                </motion.div>
                        </div>
                </section>
        );
}
