"use client";

import { Mail, MapPin, Navigation, Phone } from "lucide-react";
import { motion } from "motion/react";
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

	const contactItems = [
		{ icon: MapPin, label: "Address", value: profile.address, color: "text-orange-500", bg: "bg-orange-500/10" },
		{ icon: Phone, label: "Phone", value: profile.phone, color: "text-green-500", bg: "bg-green-500/10" },
		{ icon: Mail, label: "Email", value: profile.email, color: "text-blue-500", bg: "bg-blue-500/10" },
	].filter((item) => item.value);

	return (
		<div className="p-4 sm:p-6 space-y-6 max-w-3xl mx-auto">
			<div className="flex items-center gap-2 mb-2">
				<Navigation className="h-5 w-5 text-primary" />
				<h2 className="text-xl font-bold text-foreground">Contact & Location</h2>
			</div>

			<div className="grid gap-4">
				{contactItems.map((item, i) => {
					const Icon = item.icon;
					return (
						<motion.div
							key={item.label}
							initial={{ opacity: 0, y: 12 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ delay: i * 0.08 }}
							className="flex items-start gap-4 p-4 rounded-2xl border bg-card/80 card-hover">
							<div className={`shrink-0 flex h-11 w-11 items-center justify-center rounded-xl ${item.bg}`}>
								<Icon className={`h-5 w-5 ${item.color}`} />
							</div>
							<div>
								<p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">{item.label}</p>
								<p className="text-sm font-semibold text-foreground">{item.value}</p>
							</div>
						</motion.div>
					);
				})}
			</div>

			{profile.address && (
				<motion.div
					initial={{ opacity: 0, y: 12 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ delay: 0.3 }}
					className="rounded-2xl overflow-hidden border bg-card/80 overflow-hidden">
					<div className="flex items-center gap-2 px-4 py-3 border-b bg-muted/30">
						<MapPin className="h-4 w-4 text-primary" />
						<span className="text-sm font-semibold text-foreground">Location</span>
					</div>
					<div className="h-56">
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
				</motion.div>
			)}
		</div>
	);
}
