"use client";

import { CookingPot, CreditCard, QrCode, ScanLine, Utensils } from "lucide-react";
import { motion } from "motion/react";

const steps = [
	{
		icon: QrCode,
		title: "Register",
		description: "Restaurant signs up, sets up profile, adds tables & menu",
		person: "🧑‍💻",
		personAlt: "boy at laptop",
	},
	{
		icon: ScanLine,
		title: "Get QR Codes",
		description: "Unique QR codes generated for every table. Print & place.",
		person: "📱",
		personAlt: "girl scanning phone",
	},
	{
		icon: Utensils,
		title: "Customer Orders",
		description: "Scan → Browse → Customize (spice, notes) → Add to cart",
		person: "🍽️",
		personAlt: "person on phone",
	},
	{
		icon: CookingPot,
		title: "Kitchen Prepares",
		description: "Real-time order with sound alert. Accept, cook, mark ready.",
		person: "👨‍🍳",
		personAlt: "chef",
	},
	{
		icon: CreditCard,
		title: "Pay & Enjoy!",
		description: "Pay online or at counter. Get digital bill. Food served!",
		person: "🎉",
		personAlt: "happy couple eating",
	},
];

export default function HowItWorksSection() {
	return (
		<section id="how-it-works" className="relative py-24 sm:py-32 bg-muted/30">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.5, ease: "easeOut" }}
					className="text-center mb-16">
					<h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">How it works</h2>
					<p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">From restaurant registration to food served — in 5 simple steps.</p>
				</motion.div>

				<div className="relative grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4">
					{/* Connecting line */}
					<div className="hidden md:block absolute top-16 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

					{steps.map((step, index) => {
						const Icon = step.icon;
						return (
							<motion.div
								key={step.title}
								initial={{ opacity: 0, y: 24 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true, margin: "-50px" }}
								transition={{ duration: 0.5, delay: index * 0.12, ease: "easeOut" }}
								className="relative flex flex-col items-center text-center">
								<div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border-2 bg-card shadow-sm mb-4">
									<Icon className="h-7 w-7 text-primary" />
								</div>
								<div className="absolute top-0 -right-2 text-2xl select-none">{step.person}</div>
								<h3 className="text-lg font-semibold text-foreground mb-1">
									<span className="text-primary mr-1">{index + 1}.</span>
									{step.title}
								</h3>
								<p className="text-sm text-muted-foreground max-w-[200px]">{step.description}</p>
							</motion.div>
						);
					})}
				</div>
			</div>
		</section>
	);
}
