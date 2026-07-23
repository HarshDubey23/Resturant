"use client";

import { ExternalLink, Heart, Sparkles } from "lucide-react";

export default function FooterSection() {
	return (
		<footer className="relative border-t border-slate-100 bg-white">
			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-8">
					{/* Brand */}
					<div className="md:col-span-2">
						<div className="flex items-center gap-2 mb-4">
							<div className="h-9 w-9 rounded-xl bg-violet-600/10 flex items-center justify-center">
								<Sparkles className="h-5 w-5 text-violet-600" />
							</div>
							<span className="text-xl font-bold tracking-tight text-slate-900">
								Order<span className="text-violet-600">Worder</span>
							</span>
						</div>
						<p className="text-sm text-slate-500 max-w-sm leading-relaxed">
							Contactless restaurant ordering made simple. Scan, order, and enjoy — no app download needed.
						</p>
						<div className="mt-6 flex items-center gap-4">
							<a
								href="https://github.com/itzzritik/OrderWorder"
								target="_blank"
								rel="noopener noreferrer"
								className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-violet-600/5 hover:border-violet-600/20 transition-all duration-200 ease-out"
								aria-label="View source on GitHub">
								<ExternalLink className="h-5 w-5 text-slate-500" />
							</a>
						</div>
					</div>

					{/* Product */}
					<div>
						<h3 className="text-sm font-semibold text-slate-900 mb-4">Product</h3>
						<ul className="space-y-3">
							{["Features", "Pricing", "Demo", "API Docs"].map((item) => (
								<li key={item}>
									<button
										onClick={() => document.getElementById(item.toLowerCase())?.scrollIntoView({ behavior: "smooth" })}
										className="text-sm text-slate-500 hover:text-violet-600 transition-all duration-200">
										{item}
									</button>
								</li>
							))}
						</ul>
					</div>

					{/* Company */}
					<div>
						<h3 className="text-sm font-semibold text-slate-900 mb-4">Company</h3>
						<ul className="space-y-3">
							{["About", "Testimonials", "Contact", "Privacy"].map((item) => (
								<li key={item}>
									<button
										onClick={() => document.getElementById(item.toLowerCase())?.scrollIntoView({ behavior: "smooth" })}
										className="text-sm text-slate-500 hover:text-violet-600 transition-all duration-200">
										{item}
									</button>
								</li>
							))}
						</ul>
					</div>
				</div>

				<div className="mt-12 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
					<div className="text-sm text-slate-500">&copy; {new Date().getFullYear()} OrderWorder, Inc. All rights reserved.</div>
					<div className="flex items-center gap-1 text-sm text-slate-500">
						Made with <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" /> for restaurants
					</div>
					<button
						onClick={() => document.getElementById("homepage")?.scrollIntoView({ behavior: "smooth" })}
						className="text-sm text-violet-600 hover:text-violet-700 font-medium transition-all duration-200">
						Back to top ↑
					</button>
				</div>
			</div>
		</footer>
	);
}
