"use client";

import { ChevronRight, CookingPot, CreditCard, QrCode, ScanLine, Utensils } from "lucide-react";
import { motion } from "motion/react";

const steps = [
	{
		icon: QrCode,
		title: "Register",
		description: "Restaurant signs up, sets up profile, adds tables & menu",
		gradient: "from-violet-500 to-violet-600",
		number: "01",
	},
	{
		icon: ScanLine,
		title: "Get QR Codes",
		description: "Unique QR codes generated for every table. Print & place.",
		gradient: "from-violet-600 to-fuchsia-500",
		number: "02",
	},
	{
		icon: Utensils,
		title: "Customer Orders",
		description: "Scan → Browse → Customize (spice, notes) → Add to cart",
		gradient: "from-fuchsia-500 to-purple-500",
		number: "03",
	},
	{
		icon: CookingPot,
		title: "Kitchen Prepares",
		description: "Real-time order with sound alert. Accept, cook, mark ready.",
		gradient: "from-purple-500 to-violet-600",
		number: "04",
	},
	{
		icon: CreditCard,
		title: "Pay & Enjoy!",
		description: "Pay online or at counter. Get digital bill. Food served!",
		gradient: "from-emerald-500 to-teal-500",
		number: "05",
	},
];

export default function HowItWorksSection() {
	return (
		<section id="how-it-works" className="relative py-28 sm:py-36 bg-white">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.6, ease: "easeOut" }}
					className="text-center mb-20">
					<h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
						How it <span className="text-gradient">works</span>
					</h2>
					<p className="mt-6 text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">From restaurant registration to food served — in 5 simple steps.</p>
				</motion.div>

				<div className="relative">
					{/* Connecting line */}
					<div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2">
						<div className="h-full bg-gradient-to-r from-transparent via-violet-600/30 to-transparent" />
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
									<div className="absolute -top-3 right-1/2 translate-x-8 text-6xl font-extrabold text-violet-600/5 select-none">{step.number}</div>

									{/* Icon */}
									<div className="relative z-10 flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-violet-600/20 bg-white shadow-soft mb-6 group-hover:shadow-soft-hover group-hover:border-violet-600/40 transition-all duration-200 ease-out">
										<div
											className={`absolute inset-1 rounded-xl bg-gradient-to-br ${step.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
										/>
										<Icon className="h-8 w-8 text-violet-600 relative z-10" />
									</div>

									{/* Arrow between steps */}
									{index < steps.length - 1 && (
										<div className="hidden lg:block absolute top-10 -right-2 z-20">
											<ChevronRight className="h-4 w-4 text-violet-600/30" />
										</div>
									)}

									<h3 className="text-lg font-bold text-slate-900 mb-2 tracking-tight">{step.title}</h3>
									<p className="text-sm text-slate-500 max-w-[200px] leading-relaxed">{step.description}</p>
								</motion.div>
							);
						})}
					</div>
				</div>
			</div>
		</section>
	);
}
