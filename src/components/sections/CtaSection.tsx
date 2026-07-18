"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CtaSection() {
	return (
		<section className="relative py-24 sm:py-32">
			<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.5, ease: "easeOut" }}>
					<h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">Ready to transform your restaurant?</h2>
					<p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
						Join the restaurants already using OrderWorder. Free to start, no commitment required.
					</p>
					<Link href="/signup">
						<Button size="lg" className="mt-8">
							Get started
							<ArrowRight className="ml-2 h-4 w-4" />
						</Button>
					</Link>
				</motion.div>
			</div>
		</section>
	);
}
