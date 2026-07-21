"use client";

import { motion } from "motion/react";
import { Star } from "lucide-react";
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
				<Star key={star} className={`${className} ${star <= Math.round(value) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`} />
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
			<h2 className="text-xl font-semibold">Ratings & Reviews</h2>

			{isLoading ? (
				<div className="space-y-3">
					{[...Array(3)].map((_, i) => (
						<div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />
					))}
				</div>
			) : !summary || summary.totalReviews === 0 ? (
				<div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
					<Star className="h-12 w-12 mb-3 text-muted-foreground/30" />
					<p className="font-medium">No reviews yet</p>
					<p className="text-sm mt-1">Be the first to share your experience after your meal.</p>
				</div>
			) : (
				<>
					{/* Summary card */}
					<div className="flex flex-col sm:flex-row gap-6 rounded-2xl border bg-card p-5">
						<div className="text-center sm:text-left">
							<div className="text-5xl font-black">{summary.averageRating.toFixed(1)}</div>
							<StarRow value={summary.averageRating} className="h-5 w-5" />
							<p className="text-sm text-muted-foreground mt-1">{summary.totalReviews} reviews</p>
						</div>
						<div className="flex-1 space-y-1.5">
							{distribution.map(([stars, count]) => (
								<div key={stars} className="flex items-center gap-2 text-sm">
									<span className="w-3 text-muted-foreground">{stars}</span>
									<Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
									<div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
										<div
											className="h-full bg-amber-400 rounded-full transition-all"
											style={{ width: summary.totalReviews ? `${(count / summary.totalReviews) * 100}%` : "0%" }}
										/>
									</div>
									<span className="w-6 text-right text-muted-foreground">{count}</span>
								</div>
							))}
						</div>
					</div>

					{/* Review list */}
					<div className="space-y-3">
						{feedbacks.map((fb, index) => (
							<motion.div
								key={fb._id}
								initial={{ opacity: 0, y: 12 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ delay: Math.min(index, 8) * 0.04 }}
								className="rounded-2xl border bg-card p-4 space-y-2">
								<div className="flex items-center justify-between">
									<div className="flex items-center gap-2">
										<div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
											{(fb.customer?.fname || "G")[0].toUpperCase()}
										</div>
										<div>
											<p className="text-sm font-medium">{fb.customer?.fname || "Guest"}</p>
											<p className="text-[11px] text-muted-foreground">
												{new Date(fb.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
											</p>
										</div>
									</div>
									<StarRow value={fb.rating} />
								</div>
								{fb.review && <p className="text-sm text-muted-foreground leading-relaxed">{fb.review}</p>}
								{(fb.foodQuality || fb.serviceSpeed || fb.taste) && (
									<div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground pt-1">
										{fb.foodQuality ? <span>Food {fb.foodQuality}/5</span> : null}
										{fb.serviceSpeed ? <span>Service {fb.serviceSpeed}/5</span> : null}
										{fb.taste ? <span>Taste {fb.taste}/5</span> : null}
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
