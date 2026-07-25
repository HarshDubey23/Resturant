"use client";

import { ArrowRight, ExternalLink, Heart, Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

/* Brand icons – SVG inline (lucide-react no longer ships these) */
const GithubIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.09-.745.083-.729.083-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12z"/>
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 22.267.792 23 1.771 23h20.451C23.2 23 24 22.267 24 21.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.227-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const socials = [
	{ label: "X", icon: Sparkles, href: "#" },
	{ label: "LinkedIn", icon: LinkedinIcon, href: "#" },
	{ label: "Instagram", icon: InstagramIcon, href: "#" },
	{ label: "YouTube", icon: YoutubeIcon, href: "#" },
	{ label: "GitHub", icon: GithubIcon, href: "#" },
];

export default function FooterSection() {
	const [email, setEmail] = useState("");
	const [submitted, setSubmitted] = useState(false);
	const [loading, setLoading] = useState(false);

	const handleNewsletter = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!email) return;
		setLoading(true);
		try {
			const res = await fetch("/api/newsletter", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, source: "footer" }),
			});
			const data = await res.json();
			if (data.alreadySubscribed) {
				toast.info("You're already subscribed!");
			} else if (res.ok) {
				setSubmitted(true);
				toast.success("Subscribed! Welcome to the OrderWorder family.");
				setEmail("");
				setTimeout(() => setSubmitted(false), 3500);
			} else {
				toast.error(data.error || "Failed to subscribe");
			}
		} catch {
			toast.error("Network error. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<footer className="relative border-t border-slate-200 bg-slate-50">
			{/* Gradient divider at top */}
			<div className="h-px w-full bg-gradient-to-r from-transparent via-violet-400/60 to-transparent" />
			<div className="h-px w-full bg-gradient-to-r from-transparent via-fuchsia-400/40 to-transparent" />

			<div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-10">
					{/* Brand + newsletter */}
					<div className="md:col-span-2">
						<div className="flex items-center gap-2 mb-4">
							<div className="h-9 w-9 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-soft">
								<Sparkles className="h-5 w-5 text-white" />
							</div>
							<span className="text-xl font-bold tracking-tight text-slate-900">
								Order<span className="text-violet-600">Worder</span>
							</span>
						</div>
						<p className="text-sm text-slate-700 max-w-sm leading-relaxed">
							Contactless restaurant ordering made simple. Scan, order, and enjoy — no app download needed.
						</p>

						{/* Newsletter mini-form */}
						<form onSubmit={handleNewsletter} className="mt-6 max-w-sm">
							<label className="block text-[11px] font-semibold uppercase tracking-wider text-violet-600 mb-2">
								Stay in the loop
							</label>
							<div className="flex items-center gap-2">
								<input
									type="email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="you@restaurant.com"
									className="h-10 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-300 transition-all"
								/>
								<button
									type="submit"
									disabled={loading}
									aria-label="Subscribe to newsletter"
									className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-500 text-white shadow-soft hover:shadow-soft-hover hover:scale-105 transition-all duration-200 disabled:opacity-60 disabled:hover:scale-100">
									{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
								</button>
							</div>
							{submitted && (
								<p className="mt-2 text-xs font-medium text-emerald-600">
									Thanks! Check your inbox to confirm.
								</p>
							)}
						</form>

						{/* Social row */}
						<div className="mt-6 flex items-center gap-2">
							{socials.map((s) => {
								const Icon = s.icon;
								return (
									<a
										key={s.label}
										href={s.href}
										aria-label={s.label}
										className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 hover:-translate-y-0.5 transition-all duration-200 ease-out">
										<Icon className="h-4 w-4" />
									</a>
								);
							})}
							<a
								href="https://github.com/itzzritik/OrderWorder"
								target="_blank"
								rel="noopener noreferrer"
								className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-violet-600 hover:border-violet-300 hover:bg-violet-50 hover:-translate-y-0.5 transition-all duration-200 ease-out"
								aria-label="View source on GitHub">
								<ExternalLink className="h-4 w-4" />
							</a>
						</div>
					</div>

					{/* Product */}
					<div>
						<h3 className="text-[11px] font-bold uppercase tracking-wider text-violet-600 mb-4">Product</h3>
						<ul className="space-y-3">
							{["Features", "Menu", "Pricing", "FAQ", "Demo"].map((item) => (
								<li key={item}>
									<button
										onClick={() => document.getElementById(item.toLowerCase())?.scrollIntoView({ behavior: "smooth" })}
										className="group relative text-sm text-slate-600 hover:text-violet-600 transition-colors duration-200">
										{item}
										<span className="absolute -bottom-0.5 left-0 h-px w-0 bg-violet-600 transition-all duration-300 group-hover:w-full" />
									</button>
								</li>
							))}
						</ul>
					</div>

					{/* Company */}
					<div>
						<h3 className="text-[11px] font-bold uppercase tracking-wider text-violet-600 mb-4">Company</h3>
						<ul className="space-y-3">
							{["About", "Testimonials", "Contact", "Privacy"].map((item) => (
								<li key={item}>
									<button
										onClick={() => document.getElementById(item.toLowerCase())?.scrollIntoView({ behavior: "smooth" })}
										className="group relative text-sm text-slate-600 hover:text-violet-600 transition-colors duration-200">
										{item}
										<span className="absolute -bottom-0.5 left-0 h-px w-0 bg-violet-600 transition-all duration-300 group-hover:w-full" />
									</button>
								</li>
							))}
						</ul>

						{/* Status pill */}
						<div className="mt-5">
							<div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
								<span className="relative flex h-2 w-2">
									<span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
									<span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
								</span>
								All systems operational
							</div>
						</div>
					</div>
				</div>

				{/* Copyright bar */}
				<div className="mt-12 pt-6 border-t border-slate-200 bg-slate-100/60 -mx-4 px-4 sm:mx-0 sm:px-0 sm:rounded-xl">
					<div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
						<div className="text-sm text-slate-600">
							&copy; {new Date().getFullYear()} OrderWorder, Inc. All rights reserved.
						</div>
						<div className="flex items-center gap-3 text-sm text-slate-600">
							<div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
								<span aria-hidden>🇮🇳</span>
								Made in India
							</div>
							<div className="flex items-center gap-1 text-slate-600">
								Made with <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" /> for restaurants
							</div>
						</div>
						<button
							onClick={() => document.getElementById("homepage")?.scrollIntoView({ behavior: "smooth" })}
							className="group text-sm text-violet-600 hover:text-violet-700 font-medium transition-all duration-200">
							Back to top
							<span className="inline-block ml-1 transition-transform duration-200 group-hover:-translate-y-0.5">↑</span>
						</button>
					</div>
				</div>
			</div>
		</footer>
	);
}
