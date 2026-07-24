"use client";

import { CookingPot, LineChart, Megaphone, QrCode, Smartphone, Star, Zap } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";

interface Feature {
	icon: typeof QrCode;
	title: string;
	description: string;
	gradient: string;
	iconBg: string;
	className: string;
	thumb: string;
	thumbAlt: string;
}

const features: Feature[] = [
	{
		icon: QrCode,
		title: "QR Ordering",
		description: "Customers scan a table-specific QR, browse your menu, customize items with spice levels & notes, and order — no app download needed.",
		gradient: "from-violet-500/20 to-fuchsia-500/20",
		iconBg: "bg-violet-500/10",
		className: "md:col-span-2 md:row-span-1",
		thumb: "/food-images/dishes/pani-puri.png",
		thumbAlt: "Pani puri, a classic scan-and-eat street snack",
	},
	{
		icon: CookingPot,
		title: "Kitchen Display",
		description: "Real-time orders with sound alerts, spice-level indicators, and customer notes. Accept, prepare, and mark ready — all with one tap.",
		gradient: "from-violet-600/20 to-purple-500/20",
		iconBg: "bg-violet-600/10",
		className: "md:col-span-1 md:row-span-1",
		thumb: "/food-images/dishes/tandoori-chicken.png",
		thumbAlt: "Tandoori chicken fresh out of the kitchen tandoor",
	},
	{
		icon: Smartphone,
		title: "Digital Payment",
		description: "Razorpay & Stripe integrated. Customers pay via UPI, cards, or wallets. Digital bill PDF generated automatically.",
		gradient: "from-emerald-500/20 to-teal-500/20",
		iconBg: "bg-emerald-500/10",
		className: "md:col-span-1 md:row-span-1",
		thumb: "/food-images/dishes/masala-chai.png",
		thumbAlt: "A cup of masala chai, the perfect post-pay moment",
	},
	{
		icon: LineChart,
		title: "Analytics & Insights",
		description: "Revenue breakdown, popular items, peak hours, and customer trends visualized with AI-powered recommendations.",
		gradient: "from-violet-500/20 to-indigo-500/20",
		iconBg: "bg-violet-500/10",
		className: "md:col-span-1 md:row-span-1",
		thumb: "/food-images/dishes/biryani.png",
		thumbAlt: "A plate of biryani, a top-selling analytics favourite",
	},
	{
		icon: Star,
		title: "Loyalty Program",
		description: "Points, tiers, rewards, and auto-redemption. Keep customers coming back with a built-in loyalty system.",
		gradient: "from-amber-500/20 to-yellow-500/20",
		iconBg: "bg-amber-500/10",
		className: "md:col-span-2 md:row-span-1",
		thumb: "/food-images/dishes/gulab-jamun.png",
		thumbAlt: "Gulab jamun, a sweet loyalty reward",
	},
	{
		icon: Megaphone,
		title: "WhatsApp Campaigns",
		description: "Birthday offers, order updates, and promotional campaigns via WhatsApp Cloud API. Automated and scheduled.",
		gradient: "from-purple-500/20 to-pink-500/20",
		iconBg: "bg-purple-500/10",
		className: "md:col-span-1 md:row-span-1",
		thumb: "/food-images/dishes/pizza.png",
		thumbAlt: "A margherita pizza, perfect for a WhatsApp promo",
	},
];

export default function FeaturesSection() {
	const prefersReduced = useReducedMotion();
	return (
		<section id="features" className="relative py-28 sm:py-36 bg-slate-50 overflow-hidden">
			{/* Subtle ambiance backdrop */}
			<div className="absolute inset-0 -z-10 opacity-[0.04] pointer-events-none">
				<Image src="/food-images/ambiance/restaurant-interior.png" alt="" fill sizes="100vw" className="object-cover" aria-hidden />
			</div>
			<div className="absolute inset-0 bg-mesh pointer-events-none" />
			<div className="absolute top-1/2 left-0 w-96 h-96 bg-violet-600/5 rounded-full blur-[100px]" />
			<div className="absolute bottom-0 right-0 w-96 h-96 bg-violet-500/5 rounded-full blur-[100px]" />

			<div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.6, ease: "easeOut" }}
					className="text-center mb-20">
					<div className="inline-flex items-center gap-2 rounded-full border border-slate-200/50 bg-white/80 px-4 py-1.5 text-sm text-slate-500 mb-6 shadow-soft">
						<Zap className="h-3.5 w-3.5 text-violet-600" />
						Powerful Features
					</div>
					<h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
						Everything you need to
						<br />
						<span className="text-gradient">run your restaurant</span>
					</h2>
					<p className="mt-6 text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
						One platform for contactless ordering, kitchen display, payments, and growth.
					</p>
				</motion.div>

				<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
					{features.map((feature, index) => {
						const Icon = feature.icon;
						return (
							<motion.div
								key={feature.title}
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true, margin: "-50px" }}
								transition={{
									duration: 0.5,
									delay: prefersReduced ? 0 : index * 0.08,
									ease: "easeOut",
								}}
								className={`${feature.className} group relative overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-soft p-6 transition-all duration-200 ease-out hover:shadow-soft-hover hover:-translate-y-0.5`}>
								{/* Gradient glow on hover */}
								<div
									className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
								/>

								<div className="relative z-10 flex items-start gap-4">
									<div className="relative shrink-0">
										<div
											className={`flex h-14 w-14 items-center justify-center rounded-2xl ${feature.iconBg} border border-white/10 group-hover:scale-110 transition-transform duration-300`}>
											<Icon className="h-7 w-7 text-violet-600" />
										</div>
										{/* Dish thumbnail peeking from behind the icon */}
										<div className="absolute -bottom-3 -right-3 h-12 w-12 rounded-xl overflow-hidden border-2 border-white shadow-soft opacity-0 group-hover:opacity-100 group-hover:scale-100 scale-75 transition-all duration-300 rotate-6">
											<div className="relative h-full w-full">
												<Image src={feature.thumb} alt={feature.thumbAlt} fill sizes="48px" className="object-cover" />
											</div>
										</div>
									</div>
									<div className="flex-1 min-w-0">
										<h3 className="text-xl font-bold text-slate-900 mb-3 tracking-tight">{feature.title}</h3>
										<p className="text-sm text-slate-500 leading-relaxed">{feature.description}</p>
									</div>
								</div>
							</motion.div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
