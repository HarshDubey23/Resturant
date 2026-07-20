"use client";

import { useSearchParams } from "next/navigation";

import OrderPage from "@/components/features/OrderPage";
import ContactTab from "./ContactTab";
import ExploreTab from "./ExploreTab";

export default function PageContainer() {
	const searchParams = useSearchParams();
	const tab = searchParams.get("tab");

	return (
		<div className="pageContainer">
			{tab === "explore" && <ExploreTab />}
			{tab === "menu" && <OrderPage />}
			{tab === "contact" && <ContactTab />}
		</div>
	);
}
