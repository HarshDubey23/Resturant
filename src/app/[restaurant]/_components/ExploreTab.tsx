"use client";

import { useRestaurant } from "#components/context/useContext";

export default function ExploreTab() {
	const { restaurant } = useRestaurant();
	const photos = (restaurant as unknown as { photos?: string[] })?.photos || [];

	if (photos.length === 0) return null;

	return (
		<div className="p-4">
			<h2 className="text-xl font-semibold mb-4">Gallery</h2>
			<div className="grid grid-cols-2 md:grid-cols-3 gap-3">
				{photos.map((url, i) => (
					<div key={i} className="aspect-square rounded-xl overflow-hidden bg-gray-100">
						<img src={url} alt={`Photo ${i + 1}`} className="w-full h-full object-cover" loading="lazy" />
					</div>
				))}
			</div>
		</div>
	);
}
