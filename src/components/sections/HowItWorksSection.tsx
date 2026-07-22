"use client";

import { CookingPot, CreditCard, QrCode, ScanLine, Utensils, ChevronRight } from "lucide-react";
import { motion } from "motion/react";

const steps = [
	{
		icon: QrCode,
		title: "Register",
		description: "Restaurant signs up, sets up profile, adds tables & menu",
		gradient: "from-orange-500 to-amber-500",
		number: "01",
	},
	{
		icon: ScanLine,
		title: "Get QR Codes",
		description: "Unique QR codes generated for every table. Print & place.",
		gradient: "from-amber-500 to-yellow-500",
		number: "02",
	},
	{
		icon: Utensils,
		title: "Customer Orders",
		description: "Scan → Browse → Customize (spice, notes) → Add to cart",
		gradient: "from-yellow-500 to-orange-500",
		number: "03",
	},
	{
		icon: CookingPot,
		title: "Kitchen Prepares",
		description: "Real-time order with sound alert. Accept, cook, mark ready.",
		gradient: "from-red-500 to-orange-500",
		number: "04",
	},
	{
		icon: CreditCard,
		title: "Pay & Enjoy!",
		description: "Pay online or at counter. Get digital bill. Food served!",
		gradient: "from-green-500 to-emerald-500",
		number: "05",
	},
];

export default function HowItWorksSection() {
	return (
		<section id="how-it-works" className="relative py-28 sm:py-36 bg-muted/30">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.6, ease: "easeOut" }}
					className="text-center mb-20">
					<h2 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
						How it <span className="text-gradient">works</span>
					</h2>
					<p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
						From restaurant registration to food served — in 5 simple steps.
					</p>
				</motion.div>

				<div className="relative">
					{/* Connecting line */}
					<div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2">
						<div className="h-full bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
					</div>

					<div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-4">
						{steps.map((step, index) => {
							const Icon = step.icon;
							return (
								<motion.div
									key={step.title}
									initial={{ opacity: 0, y: 30 }}
									whileInView={{ opacity: 1, y: 0 }}
									viewport={{ once: true, margin: "-50px" }}
									transition={{ duration: 0.5, delay: index * 0.12, ease: "easeOut" }}
									className="relative flex flex-col items-center text-center group">
									{/* Step number */}
									<div className="absolute -top-3 right-1/2 translate-x-8 text-6xl font-black text-primary/5 select-none">
										{step.number}
									</div>

									{/* Icon */}
									<div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-primary/20 bg-card shadow-lg mb-6 group-hover:shadow-xl group-hover:border-primary/40 transition-all duration-300">
										<div className={`absolute inset-1 rounded-xl bg-gradient-to-br ${step.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
										<Icon className="h-8 w-8 text-primary relative z-10" />
									</div>

									{/* Arrow between steps */}
									{index < steps.length - 1 && (
										<div className="hidden lg:block absolute top-10 -right-2 z-20">
											<ChevronRight className="h-4 w-4 text-primary/30" />
										</div>
									)}

									<h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
									<p className="text-sm text-muted-foreground max-w-[200px]">{step.description}</p>
								</motion.div>
							);
						})}
					</div>
				</div>
			</div>
		</section>
	);
}
