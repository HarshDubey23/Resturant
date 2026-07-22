"use client";

import { Camera, RotateCw, Utensils } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { useRestaurant } from "#components/context/useContext";
import PanoramicViewer from "#components/features/PanoramicViewer";
import { PANORAMIC_FOODS } from "#utils/helper/panoramic";

export default function ExploreTab() {
	const { restaurant } = useRestaurant();
	const photos = (restaurant as unknown as { photos?: string[] })?.photos || [];
	const menus = (restaurant as unknown as { menus?: Array<{ name?: string; category?: string; panoramicImage?: string }> })?.menus || [];
	const [panoramicOpen, setPanoramicOpen] = useState(false);
	const [selectedImage, setSelectedImage] = useState("");
	const [photoErrors, setPhotoErrors] = useState<Set<number>>(new Set());

	// Build the 360° gallery from the restaurant's actual menu — items that
	// have a panoramic image set, or that match a known dish slug.
	const panoramicFoods = useMemo(() => {
		const seen = new Set<string>();
		const out: Array<{ name: string; image: string; category: string }> = [];
		for (const m of menus) {
			const slug = (m.name || "")
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-")
				.replace(/^-|-$/g, "");
			const img = m.panoramicImage || (slug && PANORAMIC_FOODS[slug]?.image) || null;
			if (!img || seen.has(img)) continue;
			seen.add(img);
			out.push({
				name: m.name || "Dish",
				image: img,
				category: m.category ? m.category.replace(/-/g, " ") : "Dish",
			});
		}
		// Always fall back to the full catalog if the restaurant's menu has no 3D items
		if (!out.length) {
			for (const [_slug, info] of Object.entries(PANORAMIC_FOODS)) {
				out.push({ name: info.name, image: info.image, category: "Speciality" });
				if (out.length >= 8) break;
			}
		}
		return out;
	}, [menus]);

	return (
		<div className="p-4 sm:p-6 space-y-8 max-w-5xl mx-auto">
			{/* Restaurant Photos */}
			{photos.length > 0 && (
				<div>
					<div className="flex items-center gap-2 mb-4">
						<Camera className="h-5 w-5 text-primary" />
						<h2 className="text-xl font-bold text-foreground">Restaurant Gallery</h2>
					</div>
					<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
						{photos.map((url, i) =>
							photoErrors.has(i) ? null : (
								<motion.div
									key={i}
									initial={{ opacity: 0, scale: 0.95 }}
									whileInView={{ opacity: 1, scale: 1 }}
									viewport={{ once: true }}
									transition={{ delay: i * 0.05 }}
									className="aspect-square rounded-2xl overflow-hidden bg-muted relative group cursor-pointer"
									onClick={() => {
										setSelectedImage(url);
										setPanoramicOpen(true);
									}}>
									<Image
										src={url}
										alt={`Gallery ${i + 1}`}
										fill
										className="object-cover group-hover:scale-105 transition-transform duration-500"
										loading="lazy"
										sizes="(max-width: 768px) 50vw, 33vw"
										onError={() => setPhotoErrors((prev) => new Set(prev).add(i))}
									/>
									<div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
								</motion.div>
							),
						)}
					</div>
				</div>
			)}

			{/* 360° Panoramic Food Gallery */}
			{panoramicFoods.length > 0 && (
				<div>
					<div className="flex items-center gap-2 mb-4">
						<RotateCw className="h-5 w-5 text-primary" />
						<h2 className="text-xl font-bold text-foreground">360° Food View</h2>
						<span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Interactive</span>
					</div>
					<p className="text-sm text-muted-foreground mb-4">Drag to rotate and explore every dish in full 360° panoramic detail</p>
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
						{panoramicFoods.map((food, i) => (
							<motion.div
								key={food.name}
								initial={{ opacity: 0, scale: 0.95 }}
								whileInView={{ opacity: 1, scale: 1 }}
								viewport={{ once: true }}
								transition={{ delay: i * 0.05 }}
								className="relative rounded-2xl overflow-hidden border bg-card group cursor-pointer card-hover"
								onClick={() => {
									setSelectedImage(food.image);
									setPanoramicOpen(true);
								}}>
								<div className="aspect-[16/10] relative overflow-hidden">
									<Image
										src={food.image}
										alt={`360° view of ${food.name}`}
										fill
										className="object-cover group-hover:scale-105 transition-transform duration-500"
										sizes="(max-width: 640px) 50vw, 25vw"
									/>
									<div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
									<div className="absolute top-2 left-2 glass rounded-full px-2 py-0.5 flex items-center gap-1">
										<RotateCw className="h-2.5 w-2.5 text-white" />
										<span className="text-[9px] font-bold text-white">360°</span>
									</div>
								</div>
								<div className="p-3">
									<p className="text-[10px] text-primary font-medium capitalize">{food.category}</p>
									<p className="text-xs font-bold text-foreground">{food.name}</p>
								</div>
							</motion.div>
						))}
					</div>
				</div>
			)}

			{/* Empty state when no content */}
			{photos.length === 0 && panoramicFoods.length === 0 && (
				<div className="flex flex-col items-center justify-center py-20 text-center">
					<div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
						<Utensils className="h-7 w-7 text-muted-foreground" />
					</div>
					<p className="mt-4 text-sm text-muted-foreground">No gallery content available yet.</p>
				</div>
			)}

			{/* Panoramic Viewer Dialog */}
			<PanoramicViewer imageUrl={selectedImage} open={panoramicOpen} onOpenChange={setPanoramicOpen} />
		</div>
	);
}
