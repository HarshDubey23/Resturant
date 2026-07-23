"use client";

import { useSearchParams } from "next/navigation";

import OrderPage from "@/components/features/OrderPage";
import ContactTab from "./ContactTab";
import ExploreTab from "./ExploreTab";
import ReviewsTab from "./ReviewsTab";

const VALID_TABS = ["explore", "menu", "reviews", "contact"] as const;
type Tab = (typeof VALID_TABS)[number];

export default function PageContainer() {
	const searchParams = useSearchParams();
	const rawTab = searchParams.get("tab");
	// Default to "menu" when no tab is specified — previously rendered a blank container
	const tab: Tab = (VALID_TABS as readonly string[]).includes(rawTab ?? "") ? (rawTab as Tab) : "menu";

	return (
		<div className="pageContainer">
			{tab === "explore" && <ExploreTab />}
			{tab === "menu" && <OrderPage />}
			{tab === "reviews" && <ReviewsTab />}
			{tab === "contact" && <ContactTab />}
		</div>
	);
}
