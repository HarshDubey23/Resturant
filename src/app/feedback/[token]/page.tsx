/** @file /feedback/[token]/page.tsx — mobile-first 5-star rating page.
 *    Token-gated: GET /api/feedback/[token] returns the restaurant identity +
 *    `submitted` flag. The page renders an animated star rating (motion
 *    scale-up on tap + navigator.vibrate haptic), toggle-chip tags, an
 *    optional comment textarea with char counter, and a submit button
 *    (disabled until rating is selected). On success: animated SVG checkmark
 *    + "Thank you!" message. If the link was already submitted, shows a
 *    graceful already-done state. `prefers-reduced-motion` is respected.
 *    Dark-mode safe via semantic tokens only. Touch targets ≥ 44px.
 * @phase 3
 * @audit-finding n/a
 */
"use client";

import { CheckCircle2, Loader2, Star } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { use, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const TAG_OPTIONS = ["Food quality", "Service", "Cleanliness", "Wait time"] as const;
const COMMENT_MAX = 500;

interface FeedbackMeta {
	restaurantName: string;
	logoUrl: string | null;
	orderId: string;
	submitted: boolean;
}

type ViewState = "loading" | "ready" | "submitting" | "success" | "already" | "error";

function prefersReducedMotion(): boolean {
	if (typeof window === "undefined") return false;
	return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

function haptic(pattern: number | number[]): void {
	if (typeof navigator === "undefined") return;
	const nav = navigator as Navigator & { vibrate?: (p: number | number[]) => boolean };
	try {
		nav.vibrate?.(pattern);
	} catch {
		// Vibration API may be unavailable (desktop / older browsers) — silent.
	}
}

export default function FeedbackPage({ params }: { params: Promise<{ token: string }> }) {
	const { token } = use(params);
	const [meta, setMeta] = useState<FeedbackMeta | null>(null);
	const [view, setView] = useState<ViewState>("loading");
	const [errorMsg, setErrorMsg] = useState<string>("");
	const [rating, setRating] = useState<number>(0);
	const [hoverRating, setHoverRating] = useState<number>(0);
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [comment, setComment] = useState<string>("");

	useEffect(() => {
		let cancelled = false;
		(async () => {
			try {
				const res = await fetch(`/api/feedback/${encodeURIComponent(token)}`, { method: "GET" });
				const data = (await res.json()) as FeedbackMeta & { message?: string };
				if (!res.ok) throw new Error(data?.message ?? "Failed to load feedback form");
				if (cancelled) return;
				setMeta({
					restaurantName: data.restaurantName,
					logoUrl: data.logoUrl,
					orderId: data.orderId,
					submitted: data.submitted,
				});
				setView(data.submitted ? "already" : "ready");
			} catch (err) {
				if (cancelled) return;
				setErrorMsg(err instanceof Error ? err.message : "Failed to load feedback form");
				setView("error");
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [token]);

	const onStarTap = (value: number) => {
		setRating(value);
		haptic(20);
	};

	const onToggleTag = (tag: string) => {
		haptic(10);
		setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
	};

	const onSubmit = async () => {
		if (rating < 1 || view !== "ready") return;
		setView("submitting");
		try {
			const res = await fetch(`/api/feedback/${encodeURIComponent(token)}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ rating, tags: selectedTags, comment: comment.trim() }),
			});
			const data = (await res.json()) as { submitted?: boolean; message?: string };
			if (!res.ok) throw new Error(data?.message ?? "Submission failed");
			haptic([10, 30, 10]);
			setView("success");
		} catch (err) {
			setErrorMsg(err instanceof Error ? err.message : "Submission failed");
			setView("ready");
		}
	};

	const commentRemaining = useMemo(() => COMMENT_MAX - comment.length, [comment.length]);

	return (
		<main className="min-h-[100dvh] bg-gradient-to-b from-background via-background to-muted/30 flex flex-col">
			{/* Restaurant header */}
			<header className="px-5 pt-6 pb-4 flex items-center gap-3">
				{meta?.logoUrl ? (
					<Image
						src={meta.logoUrl}
						alt={meta.restaurantName}
						width={44}
						height={44}
						className="rounded-full ring-2 ring-primary/20 object-cover shrink-0"
						unoptimized
					/>
				) : (
					<div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold ring-2 ring-primary/20 shrink-0" aria-hidden="true">
						{(meta?.restaurantName ?? "R").charAt(0).toUpperCase()}
					</div>
				)}
				<div className="min-w-0">
					<p className="text-sm font-semibold text-foreground truncate">{meta?.restaurantName ?? "Restaurant"}</p>
					<p className="text-xs text-muted-foreground">How was your visit?</p>
				</div>
			</header>

			<section className="flex-1 px-5 pb-6">
				<AnimatePresence mode="wait" initial={false}>
					{view === "loading" && <LoadingState key="loading" />}
					{view === "error" && <ErrorState key="error" message={errorMsg} />}
					{view === "already" && <AlreadyState key="already" restaurantName={meta?.restaurantName ?? "the restaurant"} />}
					{view === "success" && <SuccessState key="success" restaurantName={meta?.restaurantName ?? "the restaurant"} rating={rating} />}
					{view === "ready" && (
						<motion.form
							key="form"
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -12 }}
							transition={{ duration: prefersReducedMotion() ? 0 : 0.3, ease: "easeOut" }}
							className="space-y-6"
							onSubmit={(e) => {
								e.preventDefault();
								onSubmit();
							}}>
							{/* Star rating */}
							<fieldset className="space-y-3">
								<legend className="text-base font-semibold text-foreground text-center w-full">Rate your experience</legend>
								<div
									role="radiogroup"
									aria-label="Star rating"
									className="flex items-center justify-center gap-2 pt-1">
									{[1, 2, 3, 4, 5].map((value) => {
										const filled = value <= (hoverRating || rating);
										return (
											<motion.button
												key={`star-${value}`}
												type="button"
												role="radio"
												aria-checked={rating === value}
												aria-label={`${value} star${value > 1 ? "s" : ""}`}
												onClick={() => onStarTap(value)}
												onMouseEnter={() => setHoverRating(value)}
												onMouseLeave={() => setHoverRating(0)}
												onFocus={() => setHoverRating(value)}
												onBlur={() => setHoverRating(0)}
												whileTap={{ scale: prefersReducedMotion() ? 1 : 0.85 }}
												whileHover={{ scale: prefersReducedMotion() ? 1 : 1.08 }}
												initial={false}
												className="flex h-12 w-12 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
												<Star
													className={cn(
														"h-9 w-9 transition-colors duration-150",
														filled ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30",
													)}
													strokeWidth={1.5}
												/>
											</motion.button>
										);
									})}
								</div>
								<p className="text-center text-xs text-muted-foreground" aria-live="polite">
									{rating === 0 && "Tap a star to rate"}
									{rating === 1 && "Sorry to hear — we'll look into it"}
									{rating === 2 && "We can do better — please tell us more"}
									{rating === 3 && "Thanks — anything we can improve?"}
									{rating === 4 && "Glad you enjoyed it!"}
									{rating === 5 && "Thank you — see you again soon!"}
								</p>
							</fieldset>

							{/* Tags */}
							<fieldset className="space-y-2">
								<legend className="text-xs font-medium text-muted-foreground">What stood out? (optional)</legend>
								<div className="flex flex-wrap gap-2">
									{TAG_OPTIONS.map((tag) => {
										const selected = selectedTags.includes(tag);
										return (
											<motion.button
												key={`tag-${tag}`}
												type="button"
												onClick={() => onToggleTag(tag)}
												aria-pressed={selected}
												whileTap={{ scale: prefersReducedMotion() ? 1 : 0.96 }}
												className={cn(
													"min-h-[44px] rounded-full px-4 text-sm font-medium transition-colors duration-150 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
													selected
														? "bg-primary text-primary-foreground border-primary"
														: "bg-card text-foreground border-border hover:bg-muted",
												)}>
												{tag}
											</motion.button>
										);
									})}
								</div>
							</fieldset>

							{/* Comment */}
							<fieldset className="space-y-2">
								<legend className="text-xs font-medium text-muted-foreground">Anything else? (optional)</legend>
								<Textarea
									value={comment}
									onChange={(e) => setComment(e.target.value.slice(0, COMMENT_MAX))}
									placeholder="Tell us about your visit…"
									rows={4}
									maxLength={COMMENT_MAX}
									aria-label="Optional comment"
									className="min-h-[110px] resize-y"
								/>
								<div className="flex justify-end">
									<span className={cn("text-xs tabular-nums", commentRemaining < 50 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground")}>
										{comment.length}/{COMMENT_MAX}
									</span>
								</div>
							</fieldset>

							<Button
								type="submit"
								size="lg"
								className="w-full min-h-[48px] text-base"
								disabled={rating < 1 || view === "submitting"}
								loading={view === "submitting"}>
								{view === "submitting" ? (
									<>
										<Loader2 className="h-4 w-4 animate-spin" />
										Submitting…
									</>
								) : (
									"Submit feedback"
								)}
							</Button>

							<p className="text-center text-[11px] text-muted-foreground">
								Your feedback goes directly to the restaurant — no third parties.
							</p>
						</motion.form>
					)}
				</AnimatePresence>
			</section>
		</main>
	);
}

// ─── Sub-views ───────────────────────────────────────────────────────────────

function LoadingState() {
	return (
		<div className="space-y-6 pt-2">
			<Skeleton className="h-6 w-3/4 mx-auto" />
			<div className="flex justify-center gap-2 py-1">
				{[0, 1, 2, 3, 4].map((i) => (
					<Skeleton key={`sk-${i.toString()}`} className="h-9 w-9 rounded-full" />
				))}
			</div>
			<Skeleton className="h-10 w-full rounded-full" />
			<Skeleton className="h-10 w-full rounded-full" />
			<Skeleton className="h-10 w-full rounded-full" />
			<Skeleton className="h-24 w-full rounded-xl" />
			<Skeleton className="h-12 w-full rounded-xl" />
		</div>
	);
}

function ErrorState({ message }: { message: string }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			className="flex flex-col items-center justify-center text-center py-12 px-4 gap-3">
			<div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
				<Star className="h-8 w-8 text-destructive" />
			</div>
			<h2 className="text-lg font-semibold text-foreground">Couldn't load this feedback link</h2>
			<p className="text-sm text-muted-foreground max-w-xs">{message || "The link may have expired or is invalid."}</p>
			<p className="text-xs text-muted-foreground">Please ask the restaurant for a fresh link.</p>
		</motion.div>
	);
}

function AlreadyState({ restaurantName }: { restaurantName: string }) {
	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			className="flex flex-col items-center justify-center text-center py-12 px-4 gap-3">
			<div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
				<CheckCircle2 className="h-8 w-8 text-primary" />
			</div>
			<h2 className="text-lg font-semibold text-foreground">Already submitted</h2>
			<p className="text-sm text-muted-foreground max-w-xs">
				You've already rated your visit to {restaurantName}. Thanks for taking the time!
			</p>
		</motion.div>
	);
}

function SuccessState({ restaurantName, rating }: { restaurantName: string; rating: number }) {
	const reduced = prefersReducedMotion();
	return (
		<motion.div
			initial={{ opacity: 0 }}
			animate={{ opacity: 1 }}
			className="flex flex-col items-center justify-center text-center py-12 px-4 gap-5">
			<div className="relative">
				<motion.div
					initial={{ scale: 0, rotate: -90 }}
					animate={{ scale: 1, rotate: 0 }}
					transition={{ duration: reduced ? 0 : 0.5, ease: "easeOut" }}
					className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/10">
					<svg viewBox="0 0 52 52" className="h-12 w-12" fill="none" aria-hidden="true">
						<motion.path
							d="M14 27 L22 35 L38 17"
							stroke="currentColor"
							strokeWidth={4}
							strokeLinecap="round"
							strokeLinejoin="round"
							className="text-emerald-600 dark:text-emerald-400"
							initial={{ pathLength: 0 }}
							animate={{ pathLength: 1 }}
							transition={{ duration: reduced ? 0 : 0.6, ease: "easeOut", delay: reduced ? 0 : 0.2 }}
						/>
					</svg>
				</motion.div>
			</div>
			<div className="space-y-1">
				<h2 className="text-xl font-bold text-foreground">Thank you!</h2>
				<p className="text-sm text-muted-foreground max-w-xs">
					{rating >= 4
						? `We're so glad you enjoyed ${restaurantName}. See you again soon!`
						: `Thanks for the honest feedback. ${restaurantName} will use it to improve.`}
				</p>
			</div>
			<div className="flex gap-1 pt-2" aria-hidden="true">
				{[1, 2, 3, 4, 5].map((v) => (
					<Star key={`success-star-${v.toString()}`} className={cn("h-5 w-5", v <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20")} />
				))}
			</div>
		</motion.div>
	);
}
