"use client";

import { CookingPot, LineChart, Megaphone, QrCode, Smartphone, Star, Zap } from "lucide-react";
import { motion } from "motion/react";

const features = [
	{
		icon: QrCode,
		title: "QR Ordering",
		description: "Customers scan a table-specific QR, browse your menu, customize items with spice levels & notes, and order — no app download needed.",
		gradient: "from-orange-500/20 to-amber-500/20",
		iconBg: "bg-orange-500/10",
		className: "md:col-span-2 md:row-span-1",
	},
	{
		icon: CookingPot,
		title: "Kitchen Display",
		description: "Real-time orders with sound alerts, spice-level indicators, and customer notes. Accept, prepare, and mark ready — all with one tap.",
		gradient: "from-red-500/20 to-orange-500/20",
		iconBg: "bg-red-500/10",
		className: "md:col-span-1 md:row-span-1",
	},
	{
		icon: Smartphone,
		title: "Digital Payment",
		description: "Razorpay & Stripe integrated. Customers pay via UPI, cards, or wallets. Digital bill PDF generated automatically.",
		gradient: "from-green-500/20 to-emerald-500/20",
		iconBg: "bg-green-500/10",
		className: "md:col-span-1 md:row-span-1",
	},
	{
		icon: LineChart,
		title: "Analytics & Insights",
		description: "Revenue breakdown, popular items, peak hours, and customer trends visualized with AI-powered recommendations.",
		gradient: "from-blue-500/20 to-indigo-500/20",
		iconBg: "bg-blue-500/10",
		className: "md:col-span-1 md:row-span-1",
	},
	{
		icon: Star,
		title: "Loyalty Program",
		description: "Points, tiers, rewards, and auto-redemption. Keep customers coming back with a built-in loyalty system.",
		gradient: "from-yellow-500/20 to-amber-500/20",
		iconBg: "bg-yellow-500/10",
		className: "md:col-span-2 md:row-span-1",
	},
	{
		icon: Megaphone,
		title: "WhatsApp Campaigns",
		description: "Birthday offers, order updates, and promotional campaigns via WhatsApp Cloud API. Automated and scheduled.",
		gradient: "from-purple-500/20 to-pink-500/20",
		iconBg: "bg-purple-500/10",
		className: "md:col-span-1 md:row-span-1",
	},
];

export default function FeaturesSection() {
	return (
		<section id="features" className="relative py-28 sm:py-36">
			{/* Background decoration */}
			<div className="absolute inset-0 bg-mesh pointer-events-none" />
			<div className="absolute top-1/2 left-0 w-96 h-96 bg-primary/5 rounded-full blur-[100px]" />
			<div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-[100px]" />

			<div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.6, ease: "easeOut" }}
					className="text-center mb-20">
					<div className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-4 py-1.5 text-sm text-muted-foreground mb-6 shadow-sm">
						<Zap className="h-3.5 w-3.5 text-primary" />
						Powerful Features
					</div>
					<h2 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
						Everything you need to
						<br />
						<span className="text-gradient">run your restaurant</span>
					</h2>
					<p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">One platform for contactless ordering, kitchen display, payments, and growth.</p>
				</motion.div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
					{features.map((feature, index) => {
						const Icon = feature.icon;
						return (
							<motion.div
								key={feature.title}
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true, margin: "-50px" }}
								transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
								className={`${feature.className} group relative overflow-hidden rounded-2xl border bg-card/80 backdrop-blur-sm p-8 card-hover`}>
								{/* Gradient glow on hover */}
								<div
									className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
								/>

								<div className="relative z-10">
									<div
										className={`flex h-14 w-14 items-center justify-center rounded-2xl ${feature.iconBg} border border-white/10 mb-6 group-hover:scale-110 transition-transform duration-300`}>
										<Icon className="h-7 w-7 text-primary" />
									</div>
									<h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
									<p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
								</div>
							</motion.div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
