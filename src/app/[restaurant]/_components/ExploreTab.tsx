"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Camera, RotateCw } from "lucide-react";
import { useRestaurant } from "#components/context/useContext";
import { useState } from "react";
import PanoramicViewer from "#components/features/PanoramicViewer";

export default function ExploreTab() {
	const { restaurant } = useRestaurant();
	const photos = (restaurant as unknown as { photos?: string[] })?.photos || [];
	const [panoramicOpen, setPanoramicOpen] = useState(false);
	const [selectedImage, setSelectedImage] = useState("");

	// Map of panoramic images by food name
	const panoramicMap: Record<string, string> = {
		"butter-chicken": "/panoramic/butter-chicken-360.png",
		"paneer-tikka": "/panoramic/paneer-tikka-360.png",
		"biryani": "/panoramic/biryani-360.png",
		"masala-chai": "/panoramic/masala-chai-360.png",
		"gulab-jamun": "/panoramic/gulab-jamun-360.png",
		"rogan-josh": "/panoramic/rogan-josh-360.png",
		"mango-lassi": "/panoramic/mango-lassi-360.png",
		"chicken-tikka": "/panoramic/chicken-tikka-360.png",
		"dal-makhani": "/panoramic/dal-makhani-360.png",
		"garlic-naan": "/panoramic/garlic-naan-360.png",
		"palak-paneer": "/panoramic/palak-paneer-360.png",
	};

	// Sample panoramic food items for the gallery
	const panoramicFoods = [
		{ name: "Butter Chicken", image: "/panoramic/butter-chicken-360.png", category: "Main Course" },
		{ name: "Paneer Tikka", image: "/panoramic/paneer-tikka-360.png", category: "Starter" },
		{ name: "Biryani", image: "/panoramic/biryani-360.png", category: "Main Course" },
		{ name: "Masala Chai", image: "/panoramic/masala-chai-360.png", category: "Beverage" },
		{ name: "Gulab Jamun", image: "/panoramic/gulab-jamun-360.png", category: "Dessert" },
		{ name: "Rogan Josh", image: "/panoramic/rogan-josh-360.png", category: "Main Course" },
		{ name: "Mango Lassi", image: "/panoramic/mango-lassi-360.png", category: "Beverage" },
		{ name: "Chicken Tikka", image: "/panoramic/chicken-tikka-360.png", category: "Starter" },
	];

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
						{photos.map((url, i) => (
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
								<Image src={url} alt={`Gallery ${i + 1}`} fill className="object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" sizes="(max-width: 768px) 50vw, 33vw" />
								<div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
							</motion.div>
						))}
					</div>
				</div>
			)}

			{/* 360° Panoramic Food Gallery */}
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
								<p className="text-[10px] text-primary font-medium">{food.category}</p>
								<p className="text-xs font-bold text-foreground">{food.name}</p>
							</div>
						</motion.div>
					))}
				</div>
			</div>

			{/* Panoramic Viewer Dialog */}
			<PanoramicViewer
				imageUrl={selectedImage}
				open={panoramicOpen}
				onOpenChange={setPanoramicOpen}
			/>
		</div>
	);
}
