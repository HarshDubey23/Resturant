"use client";

import {
        Brain,
        CalendarClock,
        Languages,
        LayoutDashboard,
        MessageSquare,
        Phone,
        QrCode,
        Shield,
        ShoppingCart,
        Sparkles,
        Star,
        Utensils,
} from "lucide-react";
import { motion } from "motion/react";

const VISION_FEATURES = [
        {
                icon: Brain,
                name: "Guest Intelligence Engine",
                tag: "AI Memory",
                desc: "Remembers every guest — spice tolerance, allergies, favorites, last visit. Your staff walks in already knowing the regulars.",
                accent: "from-violet-500/15 to-fuchsia-500/15",
                ring: "ring-violet-500/20",
        },
        {
                icon: Phone,
                name: "AI Phone Agent",
                tag: "Voice IVR",
                desc: "Answers every call in Hindi & English. Takes reservations, reads out today's specials, routes complex requests to staff — 24×7, no hold music.",
                accent: "from-blue-500/15 to-cyan-500/15",
                ring: "ring-blue-500/20",
        },
        {
                icon: LayoutDashboard,
                name: "Smart Table Management",
                tag: "Floor OS",
                desc: "Predicts turn-around time per table based on party size + dish mix. Tells the host exactly when the next table frees up — no more 'just 10 minutes' guessing.",
                accent: "from-emerald-500/15 to-teal-500/15",
                ring: "ring-emerald-500/20",
        },
        {
                icon: Utensils,
                name: "AR Menu",
                tag: "3D Preview",
                desc: "Every dish rendered as a photoreal 3D model. Customers rotate, zoom, and inspect before ordering — drops return-rate to under 1%.",
                accent: "from-orange-500/15 to-amber-500/15",
                ring: "ring-orange-500/20",
        },
        {
                icon: Languages,
                name: "Voice Ordering · 12 Languages",
                tag: "Multilingual",
                desc: "Hindi, English, Tamil, Telugu, Bengali, Marathi, Gujarati, Punjabi, Kannada, Malayalam, Urdu, Arabic. Just speak — we build the cart.",
                accent: "from-rose-500/15 to-pink-500/15",
                ring: "ring-rose-500/20",
        },
        {
                icon: LayoutDashboard,
                name: "Self-Optimizing Menu Boards",
                tag: "Dynamic Pricing",
                desc: "Digital boards re-rank items every 15 min based on demand, weather, and inventory. Slow-moving items get a gentle boost; low-stock items hide automatically.",
                accent: "from-yellow-500/15 to-amber-500/15",
                ring: "ring-yellow-500/20",
        },
        {
                icon: QrCode,
                name: "One QR · Everything",
                tag: "Single Scan",
                desc: "Scan once → menu, ordering, payment, feedback, loyalty, bill download. No app, no login, no friction. Works on 2G.",
                accent: "from-indigo-500/15 to-blue-500/15",
                ring: "ring-indigo-500/20",
        },
        {
                icon: Star,
                name: "Gamified Loyalty 2.0",
                tag: "Tiers & Streaks",
                desc: "Silver / Gold / Platinum tiers, visit streaks, hidden badges, surprise rewards. Customers chase status — average visit frequency jumps 38%.",
                accent: "from-amber-500/15 to-orange-500/15",
                ring: "ring-amber-500/20",
        },
        {
                icon: MessageSquare,
                name: "Smart Feedback & Recovery",
                tag: "Real-time Save",
                desc: "Negative feedback triggers an instant recovery flow — free dessert, manager call-back, apology coupon. Catches bad reviews BEFORE they hit Zomato.",
                accent: "from-red-500/15 to-rose-500/15",
                ring: "ring-red-500/20",
        },
        {
                icon: CalendarClock,
                name: "Intelligent Reservations",
                tag: "Predictive",
                desc: "Knows your no-show probability per guest. Overbooks strategically (like airlines), sends WhatsApp confirmations, auto-cancels no-shows at +15 min.",
                accent: "from-teal-500/15 to-cyan-500/15",
                ring: "ring-teal-500/20",
        },
        {
                icon: ShoppingCart,
                name: "AI Marketing Automation",
                tag: "WhatsApp",
                desc: "Auto-segments guests (churned, VIP, birthday-this-month). Sends the right offer at the right hour. 34% open rate, 8% click-through.",
                accent: "from-green-500/15 to-emerald-500/15",
                ring: "ring-green-500/20",
        },
        {
                icon: Shield,
                name: "Zero-Trust QR Security",
                tag: "Per-Scan Auth",
                desc: "Every QR is signed, rate-limited, and geo-fenced. A photo of your table QR doesn't work from across town. PIN-gated for premium tables.",
                accent: "from-slate-500/15 to-zinc-500/15",
                ring: "ring-slate-500/20",
        },
];

export default function PlatformVisionSection() {
        return (
                <section id="platform-vision" className="relative py-28 sm:py-36 overflow-hidden">
                        {/* Background */}
                        <div className="absolute inset-0 bg-mesh pointer-events-none" />
                        <div className="absolute top-0 left-1/3 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px]" />
                        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[100px]" />

                        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                                {/* Header */}
                                <motion.div
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-100px" }}
                                        transition={{ duration: 0.6, ease: "easeOut" }}
                                        className="text-center mb-16"
                                >
                                        <div className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-4 py-1.5 text-sm text-muted-foreground mb-6 shadow-sm">
                                                <Sparkles className="h-3.5 w-3.5 text-primary" />
                                                The platform vision
                                        </div>
                                        <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
                                                Not just a QR menu.
                                                <br />
                                                <span className="text-gradient">The operating system</span> for modern restaurants.
                                        </h2>
                                        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                                                Twelve AI-native systems working in concert — from the moment a guest walks in to the moment they leave a 5-star review. All from one dashboard.
                                        </p>
                                </motion.div>

                                {/* Feature grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                        {VISION_FEATURES.map((f, i) => {
                                                const Icon = f.icon;
                                                return (
                                                        <motion.div
                                                                key={f.name}
                                                                initial={{ opacity: 0, y: 30 }}
                                                                whileInView={{ opacity: 1, y: 0 }}
                                                                viewport={{ once: true, margin: "-50px" }}
                                                                transition={{ duration: 0.5, delay: (i % 3) * 0.08, ease: "easeOut" }}
                                                                className="group relative overflow-hidden rounded-2xl border bg-card/80 backdrop-blur-sm p-6 card-hover"
                                                        >
                                                                <div className={`absolute inset-0 bg-gradient-to-br ${f.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                                                                <div className={`absolute inset-0 rounded-2xl ring-1 ring-inset ${f.ring} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                                                                <div className="relative z-10">
                                                                        <div className="flex items-start justify-between mb-4">
                                                                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                                                                        <Icon className="h-6 w-6 text-primary" />
                                                                                </div>
                                                                                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                                                                                        {f.tag}
                                                                                </span>
                                                                        </div>
                                                                        <h3 className="text-base font-bold text-foreground mb-2">{f.name}</h3>
                                                                        <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                                                                </div>
                                                        </motion.div>
                                                );
                                        })}
                                </div>

                                {/* Bottom CTA strip */}
                                <motion.div
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true, margin: "-50px" }}
                                        transition={{ duration: 0.6, delay: 0.2 }}
                                        className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4 p-8 rounded-3xl bg-gradient-to-br from-primary/10 via-accent/5 to-transparent border border-primary/20"
                                >
                                        <div className="text-center sm:text-left">
                                                <p className="text-xl font-bold text-foreground">All twelve systems. One restaurant. One dashboard.</p>
                                                <p className="text-sm text-muted-foreground mt-1">Activate the ones you want — skip the ones you don't. No code, no integrations to maintain.</p>
                                        </div>
                                        <a
                                                href="/signup"
                                                className="inline-flex items-center gap-2 px-6 h-12 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 whitespace-nowrap transition-all"
                                        >
                                                Get started free
                                                <Sparkles className="h-4 w-4" />
                                        </a>
                                </motion.div>
                        </div>
                </section>
        );
}
