"use client";

import { MessageSquare, Star } from "lucide-react";
import { motion } from "motion/react";
import useSWR from "swr";

import { useRestaurant } from "#components/context/useContext";
import { fetcher } from "#utils/helper/common";

interface ReviewDoc {
	_id: string;
	rating: number;
	review?: string;
	foodQuality?: number;
	serviceSpeed?: number;
	taste?: number;
	createdAt: string;
	customer?: { fname?: string };
}

interface ReviewSummary {
	averageRating: number;
	totalReviews: number;
	five: number;
	four: number;
	three: number;
	two: number;
	one: number;
}

function StarRow({ value, className = "h-4 w-4" }: { value: number; className?: string }) {
	return (
		<div className="flex gap-0.5" role="img" aria-label={`${value} out of 5 stars`}>
			{[1, 2, 3, 4, 5].map((star) => (
				<Star key={star} className={`${className} ${star <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`} />
			))}
		</div>
	);
}

export default function ReviewsTab() {
	const { restaurant } = useRestaurant();
	const username = (restaurant as unknown as { username?: string } | undefined)?.username;
	const { data, isLoading } = useSWR<{ feedbacks: ReviewDoc[]; summary: ReviewSummary }>(
		username ? `/api/feedback?public=true&restaurant=${encodeURIComponent(username)}` : null,
		fetcher,
	);

	const summary = data?.summary;
	const feedbacks = data?.feedbacks ?? [];
	const distribution: Array<[number, number]> = summary
		? [
				[5, summary.five],
				[4, summary.four],
				[3, summary.three],
				[2, summary.two],
				[1, summary.one],
			]
		: [];

	return (
		<div className="p-4 sm:p-6 space-y-6 max-w-3xl mx-auto">
			<div className="flex items-center gap-2 mb-2">
				<MessageSquare className="h-5 w-5 text-primary" />
				<h2 className="text-xl font-bold text-foreground">Ratings & Reviews</h2>
			</div>

			{isLoading ? (
				<div className="space-y-3">
					{[...Array(3)].map((_, i) => (
						<div key={i} className="h-28 rounded-2xl bg-muted animate-pulse" />
					))}
				</div>
			) : !summary || summary.totalReviews === 0 ? (
				<div className="flex flex-col items-center justify-center py-20 text-center">
					<div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
						<Star className="h-8 w-8 text-muted-foreground/30" />
					</div>
					<p className="text-lg font-semibold text-foreground">No reviews yet</p>
					<p className="text-sm text-muted-foreground mt-1">Be the first to share your experience after your meal.</p>
				</div>
			) : (
				<>
					{/* Summary card */}
					<motion.div
						initial={{ opacity: 0, y: 12 }}
						animate={{ opacity: 1, y: 0 }}
						className="flex flex-col sm:flex-row gap-8 rounded-2xl border bg-card/80 p-6 shadow-sm">
						<div className="text-center sm:text-left shrink-0">
							<div className="text-5xl font-black text-foreground">{summary.averageRating.toFixed(1)}</div>
							<StarRow value={summary.averageRating} className="h-5 w-5" />
							<p className="text-sm text-muted-foreground mt-2">{summary.totalReviews} reviews</p>
						</div>
						<div className="flex-1 space-y-2">
							{distribution.map(([stars, count]) => (
								<div key={stars} className="flex items-center gap-3 text-sm">
									<span className="w-3 text-muted-foreground font-medium">{stars}</span>
									<Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
									<div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
										<motion.div
											initial={{ width: 0 }}
											animate={{ width: summary.totalReviews ? `${(count / summary.totalReviews) * 100}%` : "0%" }}
											transition={{ duration: 0.6, ease: "easeOut" }}
											className="h-full bg-gradient-to-r from-amber-400 to-orange-400 rounded-full"
										/>
									</div>
									<span className="w-8 text-right text-muted-foreground text-xs font-medium">{count}</span>
								</div>
							))}
						</div>
					</motion.div>

					{/* Review list */}
					<div className="space-y-3">
						{feedbacks.map((fb, index) => (
							<motion.div
								key={fb._id}
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: Math.min(index, 8) * 0.04 }}
								className="rounded-2xl border bg-card/80 p-5 space-y-3 card-hover">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-sm font-bold text-primary">
											{(fb.customer?.fname || "G")[0].toUpperCase()}
										</div>
										<div>
											<p className="text-sm font-semibold text-foreground">{fb.customer?.fname || "Guest"}</p>
											<p className="text-[11px] text-muted-foreground">
												{new Date(fb.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
											</p>
										</div>
									</div>
									<StarRow value={fb.rating} />
								</div>
								{fb.review && <p className="text-sm text-muted-foreground leading-relaxed">{fb.review}</p>}
								{(fb.foodQuality || fb.serviceSpeed || fb.taste) && (
									<div className="flex flex-wrap gap-2 pt-1">
										{fb.foodQuality ? (
											<span className="text-[11px] px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-600 font-medium">
												Food {fb.foodQuality}/5
											</span>
										) : null}
										{fb.serviceSpeed ? (
											<span className="text-[11px] px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 font-medium">
												Service {fb.serviceSpeed}/5
											</span>
										) : null}
										{fb.taste ? (
											<span className="text-[11px] px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 font-medium">Taste {fb.taste}/5</span>
										) : null}
									</div>
								)}
							</motion.div>
						))}
					</div>
				</>
			)}
		</div>
	);
}
