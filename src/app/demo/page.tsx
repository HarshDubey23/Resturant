"use client";

import { ArrowRight, BarChart3, Clock, CreditCard, QrCode, RotateCw, Shield, Sparkles, Star, Users, UtensilsCrossed } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const demoSteps = [
	{
		icon: QrCode,
		title: "Scan the QR Code",
		description:
			"Each table gets a unique QR code. Customers simply point their phone camera to scan — no app download required. The menu opens instantly in their browser with a beautiful, intuitive interface.",
		color: "text-orange-500",
		bg: "bg-orange-500/10",
	},
	{
		icon: UtensilsCrossed,
		title: "Browse & Customize Menu",
		description:
			"Explore the full menu with gorgeous food photography. Every dish features 360° panoramic images that you can rotate and zoom. Customize spice levels, add special notes, and see real-time pricing.",
		color: "text-red-500",
		bg: "bg-red-500/10",
	},
	{
		icon: CreditCard,
		title: "Place Order & Pay",
		description:
			"Add items to cart with one tap. Review your order, apply coupons, and pay securely via Razorpay or Stripe. Support for UPI, cards, wallets, and split payments with friends.",
		color: "text-green-500",
		bg: "bg-green-500/10",
	},
	{
		icon: BarChart3,
		title: "Track & Enjoy",
		description:
			"Watch your order status in real-time as the kitchen accepts, prepares, and serves your food. Get notified when it's ready. Leave a review and earn loyalty points for your next visit.",
		color: "text-blue-500",
		bg: "bg-blue-500/10",
	},
];

const panoramicFoods = [
	{ name: "Butter Chicken", image: "/panoramic/butter-chicken-360.png", category: "Main Course", price: 380 },
	{ name: "Paneer Tikka", image: "/panoramic/paneer-tikka-360.png", category: "Starter", price: 220 },
	{ name: "Biryani", image: "/panoramic/biryani-360.png", category: "Main Course", price: 320 },
	{ name: "Masala Chai", image: "/panoramic/masala-chai-360.png", category: "Beverage", price: 80 },
	{ name: "Gulab Jamun", image: "/panoramic/gulab-jamun-360.png", category: "Dessert", price: 120 },
	{ name: "Rogan Josh", image: "/panoramic/rogan-josh-360.png", category: "Main Course", price: 450 },
	{ name: "Mango Lassi", image: "/panoramic/mango-lassi-360.png", category: "Beverage", price: 120 },
	{ name: "Chicken Tikka", image: "/panoramic/chicken-tikka-360.png", category: "Starter", price: 280 },
	{ name: "Dal Makhani", image: "/panoramic/dal-makhani-360.png", category: "Main Course", price: 280 },
	{ name: "Palak Paneer", image: "/panoramic/palak-paneer-360.png", category: "Main Course", price: 260 },
];

const highlights = [
	{ icon: RotateCw, label: "360° Food View", desc: "Panoramic images for every dish" },
	{ icon: Sparkles, label: "AI Assistant", desc: "Chat-based menu recommendations" },
	{ icon: Star, label: "Loyalty Program", desc: "Points, tiers & auto-redemption" },
	{ icon: Users, label: "Split Payments", desc: "Split bill with friends easily" },
	{ icon: Clock, label: "Real-time Tracking", desc: "Live order status updates" },
	{ icon: Shield, label: "Secure Payments", desc: "Razorpay & Stripe integrated" },
];

export default function DemoPage() {
	return (
		<div className="min-h-screen bg-background">
			{/* Hero */}
			<section className="relative py-20 sm:py-32 overflow-hidden">
				<div className="absolute inset-0 bg-mesh pointer-events-none" />
				<div className="absolute top-20 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px]" />

				<div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
					<motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center">
						<div className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-5 py-2 text-sm text-muted-foreground mb-8 shadow-sm">
							<Sparkles className="h-4 w-4 text-primary" />
							Interactive Demo Guide
						</div>
						<h1 className="text-5xl sm:text-6xl md:text-7xl font-black tracking-tight text-foreground leading-[1.1]">
							Experience <span className="text-gradient">OrderWorder</span>
							<br />
							in Action
						</h1>
						<p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
							Explore every feature with our interactive demo. See how 360° panoramic food images, AI-powered recommendations, and seamless ordering come
							together to create the ultimate dining experience.
						</p>

						<div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
							<Link href="/demo?tab=menu">
								<Button size="lg" className="gap-2 text-base h-13 px-8 rounded-xl shadow-lg shadow-primary/25">
									Explore Demo Menu
									<ArrowRight className="h-4 w-4" />
								</Button>
							</Link>
							<Link href="/">
								<Button variant="outline" size="lg" className="gap-2 text-base h-13 px-8 rounded-xl border-2">
									Back to Home
								</Button>
							</Link>
						</div>
					</motion.div>
				</div>
			</section>

			{/* Feature Highlights */}
			<section className="py-16 bg-muted/30">
				<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
						{highlights.map((item, i) => {
							const Icon = item.icon;
							return (
								<motion.div
									key={item.label}
									initial={{ opacity: 0, y: 20 }}
									whileInView={{ opacity: 1, y: 0 }}
									viewport={{ once: true }}
									transition={{ delay: i * 0.05 }}
									className="flex flex-col items-center text-center p-5 rounded-2xl border bg-card/80 card-hover">
									<div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
										<Icon className="h-6 w-6 text-primary" />
									</div>
									<p className="text-sm font-semibold text-foreground">{item.label}</p>
									<p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
								</motion.div>
							);
						})}
					</div>
				</div>
			</section>

			{/* How it Works */}
			<section className="py-24">
				<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
					<motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
						<h2 className="text-4xl sm:text-5xl font-black tracking-tight">
							How the <span className="text-gradient">Demo</span> Works
						</h2>
					</motion.div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
						{demoSteps.map((step, i) => {
							const Icon = step.icon;
							return (
								<motion.div
									key={step.title}
									initial={{ opacity: 0, y: 24 }}
									whileInView={{ opacity: 1, y: 0 }}
									viewport={{ once: true }}
									transition={{ delay: i * 0.1 }}
									className="flex gap-5 p-6 rounded-2xl border bg-card/80 card-hover">
									<div className={`shrink-0 flex h-14 w-14 items-center justify-center rounded-2xl ${step.bg}`}>
										<Icon className={`h-7 w-7 ${step.color}`} />
									</div>
									<div>
										<div className="flex items-center gap-3 mb-2">
											<span className="text-xs font-bold text-primary/40">STEP {i + 1}</span>
										</div>
										<h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
										<p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
									</div>
								</motion.div>
							);
						})}
					</div>
				</div>
			</section>

			{/* 360° Panoramic Food Gallery */}
			<section className="py-24 bg-muted/30">
				<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
					<motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-16">
						<div className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-5 py-2 text-sm text-muted-foreground mb-6 shadow-sm">
							<RotateCw className="h-4 w-4 text-primary" />
							360° Panoramic View
						</div>
						<h2 className="text-4xl sm:text-5xl font-black tracking-tight">
							Immersive <span className="text-gradient">Food Gallery</span>
						</h2>
						<p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
							Every dish comes alive with 360° panoramic photography. Rotate, zoom, and explore every detail before you order.
						</p>
					</motion.div>

					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
						{panoramicFoods.map((food, i) => (
							<motion.div
								key={food.name}
								initial={{ opacity: 0, scale: 0.95 }}
								whileInView={{ opacity: 1, scale: 1 }}
								viewport={{ once: true }}
								transition={{ delay: i * 0.05 }}
								className="group relative rounded-2xl overflow-hidden border bg-card card-hover">
								<div className="aspect-[16/9] relative overflow-hidden">
									<Image
										src={food.image}
										alt={`360° view of ${food.name}`}
										fill
										className="object-cover group-hover:scale-105 transition-transform duration-500"
										sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw"
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
									{/* 360 badge */}
									<div className="absolute top-3 left-3 glass rounded-full px-2.5 py-1 flex items-center gap-1.5">
										<RotateCw className="h-3 w-3 text-white" />
										<span className="text-[10px] font-bold text-white">360°</span>
									</div>
								</div>
								<div className="p-4">
									<p className="text-xs text-primary font-medium mb-1">{food.category}</p>
									<h3 className="text-sm font-bold text-foreground">{food.name}</h3>
									<div className="flex items-center justify-between mt-2">
										<span className="text-lg font-black text-primary">₹{food.price}</span>
										<span className="text-[10px] text-muted-foreground">Drag to rotate</span>
									</div>
								</div>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* CTA */}
			<section className="py-24">
				<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
					<motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
						<h2 className="text-4xl sm:text-5xl font-black tracking-tight">
							Ready to try it <span className="text-gradient">live</span>?
						</h2>
						<p className="mt-6 text-lg text-muted-foreground max-w-xl mx-auto">
							Sign up for a free trial and set up your restaurant in minutes. No credit card required.
						</p>
						<div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
							<Link href="/signup">
								<Button size="lg" className="gap-2 text-base h-13 px-8 rounded-xl shadow-lg shadow-primary/25">
									Start Free Trial
									<ArrowRight className="h-4 w-4" />
								</Button>
							</Link>
							<Link href="/">
								<Button variant="outline" size="lg" className="gap-2 text-base h-13 px-8 rounded-xl border-2">
									Back to Home
								</Button>
							</Link>
						</div>
					</motion.div>
				</div>
			</section>
		</div>
	);
}
