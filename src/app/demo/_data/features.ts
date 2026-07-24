import { Bell, type LucideIcon, Percent, Receipt, ShieldCheck, ShoppingBag, Stamp } from "lucide-react";

export interface FeatureTile {
	id: string;
	icon: LucideIcon;
	title: string;
	pitch: string;
	gradient: string;
	iconBg: string;
	iconColor: string;
}

export const FEATURE_TILES: FeatureTile[] = [
	{
		id: "tamper-proof-gst",
		icon: ShieldCheck,
		title: "Tamper-Proof GST",
		pitch: "Hash-chained bills that mathematically refuse to be edited after the fact.",
		gradient: "from-violet-500/15 via-fuchsia-500/10 to-transparent",
		iconBg: "bg-violet-500/10",
		iconColor: "text-violet-600 dark:text-violet-400",
	},
	{
		id: "theft-detection",
		icon: Stamp,
		title: "Theft Detection",
		pitch: "Variance between expected and counted stock flags leakage the moment it happens.",
		gradient: "from-rose-500/15 via-red-500/10 to-transparent",
		iconBg: "bg-rose-500/10",
		iconColor: "text-rose-600 dark:text-rose-400",
	},
	{
		id: "pos-essentials",
		icon: Receipt,
		title: "POS Essentials",
		pitch: "KOT, billing, split payments, shift X/Z reports — the full cashier toolkit.",
		gradient: "from-emerald-500/15 via-teal-500/10 to-transparent",
		iconBg: "bg-emerald-500/10",
		iconColor: "text-emerald-600 dark:text-emerald-400",
	},
	{
		id: "commission-saver",
		icon: Percent,
		title: "Commission Saver",
		pitch: "Branded direct-order pages that bypass aggregators and keep the 20% commission.",
		gradient: "from-amber-500/15 via-orange-500/10 to-transparent",
		iconBg: "bg-amber-500/10",
		iconColor: "text-amber-600 dark:text-amber-400",
	},
	{
		id: "owner-report",
		icon: Bell,
		title: "11 PM Owner Report",
		pitch: "A WhatsApp digest of the day's sales, voids and staff tips lands at 11 PM sharp.",
		gradient: "from-fuchsia-500/15 via-purple-500/10 to-transparent",
		iconBg: "bg-fuchsia-500/10",
		iconColor: "text-fuchsia-600 dark:text-fuchsia-400",
	},
	{
		id: "digital-tips",
		icon: ShoppingBag,
		title: "Digital Tips",
		pitch: "Razorpay/UPI tips auto-split to the staff on shift, logged to a tips ledger.",
		gradient: "from-cyan-500/15 via-sky-500/10 to-transparent",
		iconBg: "bg-cyan-500/10",
		iconColor: "text-cyan-600 dark:text-cyan-400",
	},
];
