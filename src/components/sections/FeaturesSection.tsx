"use client";

import { Bot, CookingPot, LineChart, QrCode, Salad, Smartphone } from "lucide-react";
import { motion } from "motion/react";

const features = [
	{
		icon: QrCode,
		title: "QR Ordering",
		description: "Customers scan, browse, and order from their own device. No app download, no third-party commissions.",
		className: "md:col-span-2 md:row-span-1",
	},
	{
		icon: Bot,
		title: "AI Assistant",
		description: "Jarvis recommends dishes, answers questions, and learns your menu — powered by multi-model AI.",
		className: "md:col-span-1 md:row-span-1",
	},
	{
		icon: CookingPot,
		title: "Kitchen Display",
		description: "Orders appear in real time. Kitchen staff see what's needed, when it's needed.",
		className: "md:col-span-1 md:row-span-1",
	},
	{
		icon: LineChart,
		title: "Order Analytics",
		description: "Track popular items, peak hours, and customer preferences.",
		className: "md:col-span-1 md:row-span-1",
	},
	{
		icon: Salad,
		title: "Smart Menu Management",
		description: "Update items, prices, availability, and categories instantly across all channels.",
		className: "md:col-span-2 md:row-span-1",
	},
	{
		icon: Smartphone,
		title: "Customer Profile",
		description: "Returning customers are recognized. Order history and preferences travel with them.",
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
					<h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">Everything you need to run your restaurant</h2>
					<p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
						One platform for contactless ordering, AI recommendations, and kitchen operations.
					</p>
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
								className={`${feature.className} group relative rounded-2xl border bg-card p-6 sm:p-8 hover:shadow-sm transition-shadow`}>
								<div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background mb-4">
									<Icon className="h-5 w-5 text-primary" />
								</div>
								<h3 className="text-base font-medium text-foreground mb-2">{feature.title}</h3>
								<p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
							</motion.div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
