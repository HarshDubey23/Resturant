"use client";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AmbianceSlide {
	src: string;
	title: string;
	caption: string;
	alt: string;
}

const SLIDES: AmbianceSlide[] = [
	{
		src: "/food-images/ambiance/restaurant-interior.png",
		title: "Our Floor",
		caption: "Warm timber, low light, every table its own QR.",
		alt: "Restaurant interior with warm lighting and set tables",
	},
	{
		src: "/food-images/ambiance/chef-cooking.png",
		title: "Our Kitchen",
		caption: "Tandoor, sauté, pass — every ticket audit-logged.",
		alt: "Chef plating a dish in a professional kitchen",
	},
	{
		src: "/food-images/ambiance/waiter-serving.png",
		title: "Our Team",
		caption: "Captains carry a tablet, not a notepad.",
		alt: "Waiter serving a dish to a customer at a table",
	},
	{
		src: "/food-images/ambiance/happy-customers.png",
		title: "Happy Diners",
		caption: "Scan, order, pay — they leave smiling, twice as fast.",
		alt: "Happy customers dining together at a restaurant table",
	},
	{
		src: "/food-images/ambiance/kitchen-team.png",
		title: "Our Crew",
		caption: "Shifts, tips and X/Z reports all settle in the system.",
		alt: "Kitchen team of chefs working together",
	},
	{
		src: "/food-images/ambiance/qr-scan.png",
		title: "Scan & Order",
		caption: "No app. No login. Just the menu, instantly.",
		alt: "Customer scanning a QR code on a restaurant table",
	},
];

const AUTOPLAY_MS = 5000;

export function AmbianceCarousel() {
	const prefersReduced = useReducedMotion();
	const [index, setIndex] = useState(0);
	const [playing, setPlaying] = useState(true);

	const go = useCallback((dir: 1 | -1) => {
		setIndex((i) => (i + dir + SLIDES.length) % SLIDES.length);
	}, []);

	useEffect(() => {
		if (!playing || prefersReduced) return;
		const t = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), AUTOPLAY_MS);
		return () => clearInterval(t);
	}, [playing, prefersReduced]);

	return (
		<section className="relative py-24 sm:py-32 bg-muted/30 overflow-hidden">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
				<motion.div
					initial={{ opacity: 0, y: 24 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-80px" }}
					transition={{ duration: 0.6 }}
					className="text-center mb-12">
					<div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground shadow-soft">
						Inside the room
					</div>
					<h2 className="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
						The ambiance you are <span className="text-gradient">running</span>
					</h2>
					<p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground leading-relaxed">
						OrderWorder disappears into the background of a real, breathing restaurant. Here is the room it was built for.
					</p>
				</motion.div>

				<div className="relative rounded-3xl overflow-hidden border border-border shadow-soft-hover bg-card">
					{/* Slides */}
					<div className="relative aspect-[16/10] sm:aspect-[16/7] w-full">
						{SLIDES.map((slide, i) => (
							<motion.div
								key={slide.src}
								initial={false}
								animate={{
									opacity: i === index ? 1 : 0,
									scale: i === index && !prefersReduced ? 1.04 : 1,
								}}
								transition={{ duration: 1.1, ease: "easeInOut" }}
								className="absolute inset-0">
								<Image src={slide.src} alt={slide.alt} fill sizes="(max-width: 768px) 100vw, 1200px" className="object-cover" priority={i === 0} />
								<div className="absolute inset-0 bg-gradient-to-r from-background/85 via-background/40 to-transparent" />
							</motion.div>
						))}

						{/* Caption */}
						<div className="absolute inset-0 flex items-end">
							<motion.div
								key={`caption-${index}`}
								initial={{ opacity: 0, y: 16 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: 0.2 }}
								className="p-6 sm:p-10 max-w-lg">
								<div className="text-xs uppercase tracking-[0.2em] text-primary font-semibold">{SLIDES[index].title}</div>
								<p className="mt-2 text-xl sm:text-2xl font-bold text-foreground leading-snug">{SLIDES[index].caption}</p>
							</motion.div>
						</div>

						{/* Controls */}
						<div className="absolute top-4 right-4 flex items-center gap-2">
							<button
								type="button"
								onClick={() => setPlaying((p) => !p)}
								aria-label={playing ? "Pause carousel" : "Play carousel"}
								className="flex h-10 w-10 items-center justify-center rounded-full bg-card/80 backdrop-blur-md border border-border text-foreground hover:bg-card transition-colors">
								{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
							</button>
						</div>

						<div className="absolute inset-y-0 left-0 flex items-center pl-2 sm:pl-4">
							<button
								type="button"
								onClick={() => go(-1)}
								aria-label="Previous slide"
								className="flex h-11 w-11 items-center justify-center rounded-full bg-card/80 backdrop-blur-md border border-border text-foreground hover:bg-card transition-colors">
								<ChevronLeft className="h-5 w-5" />
							</button>
						</div>
						<div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-4">
							<button
								type="button"
								onClick={() => go(1)}
								aria-label="Next slide"
								className="flex h-11 w-11 items-center justify-center rounded-full bg-card/80 backdrop-blur-md border border-border text-foreground hover:bg-card transition-colors">
								<ChevronRight className="h-5 w-5" />
							</button>
						</div>
					</div>

					{/* Dots */}
					<div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
						{SLIDES.map((s, i) => (
							<button
								key={s.src}
								type="button"
								onClick={() => setIndex(i)}
								aria-label={`Go to slide ${i + 1}`}
								aria-current={i === index}
								className={cn(
									"h-2 rounded-full transition-all duration-300",
									i === index ? "w-8 bg-primary" : "w-2 bg-foreground/30 hover:bg-foreground/50",
								)}
							/>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}
