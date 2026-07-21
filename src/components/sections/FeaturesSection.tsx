"use client";

import { CookingPot, LineChart, Megaphone, QrCode, Smartphone, Star } from "lucide-react";
import { motion } from "motion/react";

const features = [
	{
		icon: QrCode,
		title: "QR Ordering",
		description: "Customers scan a table-specific QR, browse your menu, customize items with spice levels & notes, and order — no app download needed.",
		person: "🧑‍🍳",
		personAlt: "girl-with-phone",
		className: "md:col-span-2 md:row-span-1",
	},
	{
		icon: CookingPot,
		title: "Kitchen Display",
		description: "Real-time orders with sound alerts, spice-level indicators, and customer notes. Accept, prepare, and mark ready — all with one tap.",
		person: "👨‍🍳",
		personAlt: "boy-chef",
		className: "md:col-span-1 md:row-span-1",
	},
	{
		icon: Smartphone,
		title: "Digital Payment",
		description: "Razorpay & Stripe integrated. Customers pay via UPI, cards, or wallets. Digital bill PDF generated automatically.",
		person: "💳",
		personAlt: "girl-credit-card",
		className: "md:col-span-1 md:row-span-1",
	},
	{
		icon: LineChart,
		title: "Analytics & Insights",
		description: "Revenue breakdown, popular items, peak hours, and customer trends visualized with AI-powered recommendations.",
		person: "📊",
		personAlt: "boy-with-chart",
		className: "md:col-span-1 md:row-span-1",
	},
	{
		icon: Star,
		title: "Loyalty Program",
		description: "Points, tiers, rewards, and auto-redemption. Keep customers coming back with a built-in loyalty system.",
		person: "🎂",
		personAlt: "girl-loyalty",
		className: "md:col-span-2 md:row-span-1",
	},
	{
		icon: Megaphone,
		title: "WhatsApp Campaigns",
		description: "Birthday offers, order updates, and promotional campaigns via WhatsApp Cloud API. Automated and scheduled.",
		person: "💬",
		personAlt: "boy-whatsapp",
		className: "md:col-span-1 md:row-span-1",
	},
];

export default function FeaturesSection() {
	return (
		<section id="features" className="relative py-24 sm:py-32">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.5, ease: "easeOut" }}
					className="text-center mb-16">
					<h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Everything you need to run your restaurant</h2>
					<p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">One platform for contactless ordering, kitchen display, payments, and growth.</p>
				</motion.div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
					{features.map((feature, index) => {
						const Icon = feature.icon;
						return (
							<motion.div
								key={feature.title}
								initial={{ opacity: 0, y: 24 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true, margin: "-50px" }}
								transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
								className={`${feature.className} group relative overflow-visible rounded-2xl border bg-card p-6 sm:p-8 hover:shadow-lg transition-all duration-300`}>
								<div className="flex items-start justify-between mb-4">
									<div className="flex h-12 w-12 items-center justify-center rounded-xl border bg-background">
										<Icon className="h-6 w-6 text-primary" />
									</div>
									<span className="text-3xl select-none opacity-60 group-hover:opacity-100 transition-opacity duration-300">{feature.person}</span>
								</div>
								<h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
								<p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
							</motion.div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
