"use client";

import { Quote, Star } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";

interface Testimonial {
	quote: string;
	name: string;
	role: string;
	initials: string;
	gradient: string;
	avatar: string;
}

const testimonials: Testimonial[] = [
	{
		quote: "This system saved us 2 hours of manual order taking every single day. Our staff loves it, our customers love it. Absolute game-changer.",
		name: "Priya Sharma",
		role: "Owner, Spice Kitchen",
		initials: "PS",
		gradient: "from-violet-500 to-violet-600",
		avatar: "/food-images/ambiance/happy-customers.png",
	},
	{
		quote: "The kitchen display changed how we work. Orders come in with sound alerts, spice levels are clear, and special instructions are impossible to miss.",
		name: "Rahul Verma",
		role: "Head Chef, Tandoori Nights",
		initials: "RV",
		gradient: "from-violet-600 to-purple-600",
		avatar: "/food-images/ambiance/waiter-serving.png",
	},
	{
		quote: "Our revenue grew 40% in 3 months. Customers order more when they can browse the full menu with pictures and customize everything.",
		name: "Meera Joshi",
		role: "Owner, Green Bowl Cafe",
		initials: "MJ",
		gradient: "from-fuchsia-500 to-purple-500",
		avatar: "/food-images/ambiance/happy-customers.png",
	},
	{
		quote: "Setting up QR codes for all 20 tables took 10 minutes. The demo account had pre-loaded data so I knew exactly what I was getting.",
		name: "Arjun Reddy",
		role: "Manager, Hyderabad House",
		initials: "AR",
		gradient: "from-emerald-500 to-teal-500",
		avatar: "/food-images/ambiance/waiter-serving.png",
	},
	{
		quote: "Digital bills and WhatsApp order updates eliminated all the back-and-forth with customers. Clean, professional, and foolproof.",
		name: "Ananya Patel",
		role: "Owner, Mumbai Diner",
		initials: "AP",
		gradient: "from-purple-500 to-pink-500",
		avatar: "/food-images/ambiance/happy-customers.png",
	},
	{
		quote: "I can manage my entire restaurant from the dashboard — menu, prices, analytics, staff. The AI recommendations actually work.",
		name: "Vikram Singh",
		role: "Owner, Punjab Grill",
		initials: "VS",
		gradient: "from-violet-500 to-indigo-500",
		avatar: "/food-images/ambiance/waiter-serving.png",
	},
];

export default function TestimonialsSection() {
	const prefersReduced = useReducedMotion();
	return (
		<section id="testimonials" className="relative py-28 sm:py-36 bg-slate-50 overflow-hidden">
			<div className="absolute inset-0 bg-mesh pointer-events-none" />

			<div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
				{/* Split header with happy-customers accent */}
				<div className="grid md:grid-cols-[1fr_auto] gap-8 items-center mb-16">
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ duration: 0.6, ease: "easeOut" }}>
						<h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900">
							Loved by <span className="text-gradient">restaurant owners</span>
						</h2>
						<p className="mt-6 text-lg text-slate-500 max-w-2xl leading-relaxed">See what restaurant owners and chefs say about OrderWorder.</p>
					</motion.div>
					<motion.div
						initial={{ opacity: 0, scale: 0.9 }}
						whileInView={{ opacity: 1, scale: 1 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
						className="relative h-28 w-44 sm:h-36 sm:w-56 rounded-2xl overflow-hidden shadow-soft-hover ring-1 ring-slate-200/60">
						<Image src="/food-images/ambiance/happy-customers.png" alt="Happy diners enjoying a meal together" fill sizes="224px" className="object-cover" />
						<div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
						<div className="absolute bottom-2 left-3 right-3 text-white text-xs font-semibold">Real diners. Real reviews.</div>
					</motion.div>
				</div>

				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{testimonials.map((testimonial, index) => (
						<motion.div
							key={testimonial.name}
							initial={{ opacity: 0, y: 24 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-50px" }}
							transition={{
								duration: 0.5,
								delay: prefersReduced ? 0 : index * 0.08,
								ease: "easeOut",
							}}
							className="group relative rounded-2xl border border-slate-100 bg-white shadow-soft p-7 transition-all duration-200 ease-out hover:shadow-soft-hover hover:-translate-y-0.5 overflow-hidden">
							{/* Gradient top bar */}
							<div
								className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${testimonial.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
							/>

							{/* Quote icon */}
							<div className="mb-4">
								<Quote className="h-8 w-8 text-violet-600/20" />
							</div>

							{/* Stars */}
							<div className="flex gap-0.5 mb-4">
								{[1, 2, 3, 4, 5].map((s) => (
									<Star key={s} className="h-4 w-4 fill-amber-400 text-amber-400" />
								))}
							</div>

							<p className="text-sm text-slate-900 leading-relaxed mb-6">&ldquo;{testimonial.quote}&rdquo;</p>

							<div className="flex items-center gap-3 pt-4 border-t border-slate-100">
								<div className="relative h-11 w-11 rounded-xl overflow-hidden shadow-soft ring-2 ring-white">
									<Image src={testimonial.avatar} alt="" fill sizes="44px" className="object-cover" aria-hidden />
									<div
										className={`absolute inset-0 flex items-center justify-center text-sm font-bold text-white bg-gradient-to-br ${testimonial.gradient} mix-blend-multiply`}>
										{testimonial.initials}
									</div>
								</div>
								<div>
									<div className="text-sm font-semibold text-slate-900">{testimonial.name}</div>
									<div className="text-xs text-slate-500">{testimonial.role}</div>
								</div>
							</div>
						</motion.div>
					))}
				</div>

				{/* Bottom accent strip with waiter-serving */}
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-80px" }}
					transition={{ duration: 0.6 }}
					className="relative mt-14 h-32 sm:h-44 rounded-2xl overflow-hidden shadow-soft ring-1 ring-slate-200/60">
					<Image
						src="/food-images/ambiance/waiter-serving.png"
						alt="A waiter serving a dish to a customer"
						fill
						sizes="(max-width: 768px) 100vw, 1200px"
						className="object-cover"
					/>
					<div className="absolute inset-0 bg-gradient-to-r from-slate-900/70 via-slate-900/30 to-transparent" />
					<div className="absolute inset-0 flex items-center px-6 sm:px-10">
						<div>
							<div className="text-xs uppercase tracking-[0.2em] text-violet-300 font-semibold">Behind every review</div>
							<p className="mt-1 text-lg sm:text-2xl font-bold text-white max-w-md leading-snug">
								A team that shows up — captured by OrderWorder from the dining floor.
							</p>
						</div>
					</div>
				</motion.div>
			</div>
		</section>
	);
}
