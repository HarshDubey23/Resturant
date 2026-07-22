"use client";

import { Github, Heart, Sparkles } from "lucide-react";

export default function FooterSection() {
	return (
		<footer className="relative border-t bg-card/50">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-12">
					{/* Brand */}
					<div className="md:col-span-2">
						<div className="flex items-center gap-2 mb-4">
							<div className="h-9 w-9 rounded-xl bg-primary/10 flex items-center justify-center">
								<Sparkles className="h-5 w-5 text-primary" />
							</div>
							<span className="text-xl font-bold tracking-tight text-foreground">
								Order<span className="text-primary">Worder</span>
							</span>
						</div>
						<p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
							Contactless restaurant ordering made simple. Scan, order, and enjoy — no app download needed.
						</p>
						<div className="mt-6 flex items-center gap-4">
							<a
								href="https://github.com/itzzritik/OrderWorder"
								target="_blank"
								rel="noopener noreferrer"
								className="flex h-10 w-10 items-center justify-center rounded-xl border bg-card hover:bg-primary/5 hover:border-primary/20 transition-colors"
								aria-label="View source on GitHub">
								<Github className="h-5 w-5 text-muted-foreground" />
							</a>
						</div>
					</div>

					{/* Product */}
					<div>
						<h3 className="text-sm font-semibold text-foreground mb-4">Product</h3>
						<ul className="space-y-3">
							{["Features", "Pricing", "Demo", "API Docs"].map((item) => (
								<li key={item}>
									<button
										onClick={() => document.getElementById(item.toLowerCase())?.scrollIntoView({ behavior: "smooth" })}
										className="text-sm text-muted-foreground hover:text-primary transition-colors">
										{item}
									</button>
								</li>
							))}
						</ul>
					</div>

					{/* Company */}
					<div>
						<h3 className="text-sm font-semibold text-foreground mb-4">Company</h3>
						<ul className="space-y-3">
							{["About", "Testimonials", "Contact", "Privacy"].map((item) => (
								<li key={item}>
									<button
										onClick={() => document.getElementById(item.toLowerCase())?.scrollIntoView({ behavior: "smooth" })}
										className="text-sm text-muted-foreground hover:text-primary transition-colors">
										{item}
									</button>
								</li>
							))}
						</ul>
					</div>
				</div>

				<div className="mt-12 pt-8 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
					<div className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} OrderWorder, Inc. All rights reserved.</div>
					<div className="flex items-center gap-1 text-sm text-muted-foreground">
						Made with <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" /> for restaurants
					</div>
					<button
						onClick={() => document.getElementById("homepage")?.scrollIntoView({ behavior: "smooth" })}
						className="text-sm text-primary hover:text-primary/80 font-medium transition-colors">
						Back to top ↑
					</button>
				</div>
			</div>
		</footer>
	);
}
