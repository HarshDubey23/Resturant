"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { ArrowRight, MailCheck, MailOpen, MousePointerClick, Send, Sparkles, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface TrustItem {
	icon: typeof Users;
	label: string;
}

const TRUST_ITEMS: TrustItem[] = [
	{ icon: Users, label: "Join 2,000+ restaurant owners" },
	{ icon: MailOpen, label: "1 email / month" },
	{ icon: MousePointerClick, label: "Unsubscribe in 1 click" },
];

export default function NewsletterSection() {
	const prefersReduced = useReducedMotion();
	const [email, setEmail] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault();
		const trimmed = email.trim();
		if (!trimmed) {
			toast.error("Please enter your email address.");
			return;
		}
		if (!EMAIL_REGEX.test(trimmed)) {
			toast.error("Please enter a valid email address.");
			return;
		}
		setLoading(true);
		try {
			const res = await fetch("/api/newsletter", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email: trimmed, source: "homepage" }),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok) {
				throw new Error(data?.error || "Subscription failed");
			}
			if (data?.alreadySubscribed) {
				toast.success("You're already on the list — we'll be in touch soon!");
			} else {
				toast.success("You're in! Check your inbox to confirm your subscription.");
			}
			setEmail("");
		} catch (err) {
			const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
			toast.error(message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<section
			id="newsletter"
			aria-label="Newsletter signup"
			className="relative py-20 sm:py-28 bg-slate-950 overflow-hidden">
			{/* Decorative gradient blobs */}
			<div
				aria-hidden
				className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-violet-600/30 blur-3xl"
			/>
			<div
				aria-hidden
				className="pointer-events-none absolute -bottom-32 -right-16 h-80 w-80 rounded-full bg-fuchsia-500/25 blur-3xl"
			/>
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.18),transparent_55%)]"
			/>

			<div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
				<motion.div
					initial={{ opacity: 0, y: 30 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true, margin: "-100px" }}
					transition={{ duration: 0.6, ease: "easeOut" }}
					className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-violet-600 via-violet-700 to-fuchsia-700 shadow-soft-hover">
					{/* Sheen overlay */}
					<div
						aria-hidden
						className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_45%)]"
					/>
					<div className="relative grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 p-8 sm:p-10 lg:p-14 items-center">
						{/* Left: Copy */}
						<div>
							<div className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-violet-50 backdrop-blur-sm mb-5">
								<Sparkles className="h-3.5 w-3.5" />
								Stay in the loop
							</div>
							<h2 className="text-3xl sm:text-4xl lg:text-[2.6rem] font-extrabold tracking-tight text-white leading-[1.1]">
								Get restaurant growth tips in your inbox
							</h2>
							<p className="mt-5 text-base sm:text-lg text-violet-100/90 leading-relaxed max-w-xl">
								Monthly insights on QR ordering, AI automation, and what&apos;s new at OrderWorder. No spam,
								unsubscribe anytime.
							</p>

							{/* Trust indicators */}
							<ul className="mt-7 flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-x-6 gap-y-2">
								{TRUST_ITEMS.map((t) => (
									<li
										key={t.label}
										className="inline-flex items-center gap-2 text-sm text-violet-50/95 font-medium">
										<span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
											<t.icon className="h-3.5 w-3.5" />
										</span>
										{t.label}
									</li>
								))}
							</ul>
						</div>

						{/* Right: Form card */}
						<motion.div
							initial={{ opacity: 0, scale: 0.96 }}
							whileInView={{ opacity: 1, scale: 1 }}
							viewport={{ once: true, margin: "-80px" }}
							transition={{
								duration: 0.5,
								delay: prefersReduced ? 0 : 0.12,
								ease: "easeOut",
							}}
							className="rounded-2xl border border-white/15 bg-white/95 backdrop-blur-md p-6 sm:p-8 shadow-2xl">
							<div className="flex items-center gap-2 mb-5">
								<span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600 text-white">
									<MailCheck className="h-4.5 w-4.5" />
								</span>
								<div>
									<div className="text-sm font-bold text-slate-900">Subscribe to the newsletter</div>
									<div className="text-xs text-slate-500">Free forever. Unsubscribe anytime.</div>
								</div>
							</div>

							<form onSubmit={handleSubmit} className="space-y-3" noValidate>
								<label htmlFor="newsletter-email" className="sr-only">
									Email address
								</label>
								<div className="flex flex-col sm:flex-row gap-3">
									<input
										id="newsletter-email"
										type="email"
										inputMode="email"
										autoComplete="email"
										placeholder="you@restaurant.com"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										disabled={loading}
										className="h-12 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base text-slate-900 shadow-sm transition-all duration-200 ease-out outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:border-transparent disabled:cursor-not-allowed disabled:bg-slate-50 md:text-sm"
									/>
									<Button
										type="submit"
										loading={loading}
										disabled={loading}
										className="h-12 shrink-0 rounded-xl px-5 sm:px-6 text-sm font-semibold gap-2">
										{loading ? (
											<span>Subscribing</span>
										) : (
											<>
												<span>Subscribe</span>
												<ArrowRight className="h-4 w-4" />
											</>
										)}
									</Button>
								</div>
								<p className="text-xs text-slate-500 leading-relaxed flex items-start gap-1.5">
									<Send className="h-3.5 w-3.5 mt-0.5 shrink-0 text-violet-500" aria-hidden />
									<span>
										By subscribing you agree to receive 1 monthly email from OrderWorder. We never share
										your email with third parties.
									</span>
								</p>
							</form>
						</motion.div>
					</div>
				</motion.div>
			</div>
		</section>
	);
}
