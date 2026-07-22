"use client";

import { Quote, Star } from "lucide-react";
import { motion } from "motion/react";

const testimonials = [
	{
		quote: "This system saved us 2 hours of manual order taking every single day. Our staff loves it, our customers love it. Absolute game-changer.",
		name: "Priya Sharma",
		role: "Owner, Spice Kitchen",
		initials: "PS",
		gradient: "from-orange-500 to-amber-500",
	},
	{
		quote: "The kitchen display changed how we work. Orders come in with sound alerts, spice levels are clear, and special instructions are impossible to miss.",
		name: "Rahul Verma",
		role: "Head Chef, Tandoori Nights",
		initials: "RV",
		gradient: "from-red-500 to-orange-500",
	},
	{
		quote: "Our revenue grew 40% in 3 months. Customers order more when they can browse the full menu with pictures and customize everything.",
		name: "Meera Joshi",
		role: "Owner, Green Bowl Cafe",
		initials: "MJ",
		gradient: "from-amber-500 to-yellow-500",
	},
	{
		quote: "Setting up QR codes for all 20 tables took 10 minutes. The demo account had pre-loaded data so I knew exactly what I was getting.",
		name: "Arjun Reddy",
		role: "Manager, Hyderabad House",
		initials: "AR",
		gradient: "from-green-500 to-emerald-500",
	},
	{
		quote: "Digital bills and WhatsApp order updates eliminated all the back-and-forth with customers. Clean, professional, and foolproof.",
		name: "Ananya Patel",
		role: "Owner, Mumbai Diner",
		initials: "AP",
		gradient: "from-purple-500 to-pink-500",
	},
	{
		quote: "I can manage my entire restaurant from the dashboard — menu, prices, analytics, staff. The AI recommendations actually work.",
		name: "Vikram Singh",
		role: "Owner, Punjab Grill",
		initials: "VS",
		gradient: "from-blue-500 to-indigo-500",
	},
];

export default function TestimonialsSection() {
	return (
		<section id="testimonials" className="relative py-28 sm:py-36">
			<div className="absolute inset-0 bg-mesh pointer-events-none" />

			<div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.6, ease: "easeOut" }}
					className="text-center mb-20">
					<h2 className="text-4xl sm:text-5xl font-black tracking-tight text-foreground">
						Loved by <span className="text-gradient">restaurant owners</span>
					</h2>
					<p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
						See what restaurant owners and chefs say about OrderWorder.
					</p>
				</motion.div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{testimonials.map((testimonial, index) => (
						<motion.div
							key={testimonial.name}
							initial={{ opacity: 0, y: 24 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-50px" }}
							transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
							className="group relative rounded-2xl border bg-card/80 backdrop-blur-sm p-7 card-hover overflow-hidden">
							{/* Gradient top bar */}
							<div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${testimonial.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

							{/* Quote icon */}
							<div className="mb-4">
								<Quote className="h-8 w-8 text-primary/20" />
							</div>

							{/* Stars */}
							<div className="flex gap-0.5 mb-4">
								{[1, 2, 3, 4, 5].map((s) => (
									<Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
								))}
							</div>

							<p className="text-sm text-foreground leading-relaxed mb-6">&ldquo;{testimonial.quote}&rdquo;</p>

							<div className="flex items-center gap-3 pt-4 border-t border-border/50">
								<div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-sm font-bold text-white shadow-sm`}>
									{testimonial.initials}
								</div>
								<div>
									<div className="text-sm font-semibold text-foreground">{testimonial.name}</div>
									<div className="text-xs text-muted-foreground">{testimonial.role}</div>
								</div>
							</div>
						</motion.div>
					))}
				</div>
			</div>
		</section>
	);
}
