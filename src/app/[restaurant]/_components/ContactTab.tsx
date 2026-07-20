"use client";

import { useRestaurant } from "#components/context/useContext";

export default function ContactTab() {
	const { restaurant } = useRestaurant();
	const profile = restaurant as unknown as {
		name?: string;
		address?: string;
		phone?: string;
		email?: string;
		restaurantID?: string;
	};

	if (!profile) return null;

	return (
		<div className="p-4 space-y-6">
			<h2 className="text-xl font-semibold">Contact & Location</h2>
			{profile.address && (
				<div>
					<h3 className="text-sm font-medium text-gray-500 mb-1">Address</h3>
					<p className="text-base">{profile.address}</p>
					<div className="mt-2 rounded-xl overflow-hidden h-48 bg-gray-100">
						<iframe
							title="Location"
							src={`https://maps.google.com/maps?q=${encodeURIComponent(profile.address)}&output=embed`}
							width="100%"
							height="100%"
							style={{ border: 0 }}
							loading="lazy"
							referrerPolicy="no-referrer-when-downgrade"
						/>
					</div>
				</div>
			)}
			{profile.phone && (
				<div>
					<h3 className="text-sm font-medium text-gray-500 mb-1">Phone</h3>
					<p className="text-base">{profile.phone}</p>
				</div>
			)}
			{profile.email && (
				<div>
					<h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
					<p className="text-base">{profile.email}</p>
				</div>
			)}
		</div>
	);
}
