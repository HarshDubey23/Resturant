"use client";

import { Quote } from "lucide-react";
import { motion } from "motion/react";

const testimonials = [
	{
		quote: "This system saved us 2 hours of manual order taking every single day. Our staff loves it, our customers love it. Absolute game-changer.",
		name: "Priya Sharma",
		role: "Owner, Spice Kitchen",
		initials: "PS",
		color: "bg-orange-100 text-orange-700",
	},
	{
		quote: "The kitchen display changed how we work. Orders come in with sound alerts, spice levels are clear, and special instructions are impossible to miss.",
		name: "Rahul Verma",
		role: "Head Chef, Tandoori Nights",
		initials: "RV",
		color: "bg-amber-100 text-amber-700",
	},
	{
		quote: "Our revenue grew 40% in 3 months. Customers order more when they can browse the full menu with pictures and customize everything.",
		name: "Meera Joshi",
		role: "Owner, Green Bowl Cafe",
		initials: "MJ",
		color: "bg-red-100 text-red-700",
	},
	{
		quote: "Setting up QR codes for all 20 tables took 10 minutes. The demo account had pre-loaded data so I knew exactly what I was getting.",
		name: "Arjun Reddy",
		role: "Manager, Hyderabad House",
		initials: "AR",
		color: "bg-orange-100 text-orange-700",
	},
	{
		quote: "Digital bills and WhatsApp order updates eliminated all the back-and-forth with customers. Clean, professional, and foolproof.",
		name: "Ananya Patel",
		role: "Owner, Mumbai Diner",
		initials: "AP",
		color: "bg-amber-100 text-amber-700",
	},
	{
		quote: "I can manage my entire restaurant from the dashboard — menu, prices, analytics, staff. The AI recommendations actually work.",
		name: "Vikram Singh",
		role: "Owner, Punjab Grill",
		initials: "VS",
		color: "bg-red-100 text-red-700",
	},
];

export default function TestimonialsSection() {
	return (
		<section id="testimonials" className="relative py-24 sm:py-32">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.5, ease: "easeOut" }}
					className="text-center mb-16">
					<h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">Loved by restaurant owners</h2>
					<p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">See what restaurant owners and chefs say about OrderWorder.</p>
				</motion.div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{testimonials.map((testimonial, index) => (
						<motion.div
							key={testimonial.name}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-50px" }}
							transition={{ duration: 0.4, delay: index * 0.08, ease: "easeOut" }}
							className="group relative rounded-2xl border bg-card p-6 hover:shadow-lg transition-all duration-300">
							<Quote className="h-6 w-6 text-primary/30 mb-3" />
							<p className="text-sm text-foreground leading-relaxed mb-6">&ldquo;{testimonial.quote}&rdquo;</p>
							<div className="flex items-center gap-3">
								<div className={`h-10 w-10 rounded-full ${testimonial.color} flex items-center justify-center text-sm font-semibold`}>
									{testimonial.initials}
								</div>
								<div>
									<div className="text-sm font-medium text-foreground">{testimonial.name}</div>
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
