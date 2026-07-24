import type { Metadata } from "next";
import { buildMetadata } from "#utils/seo/metadata";
import { DemoGallery } from "./DemoGallery";

export const metadata: Metadata = buildMetadata({
	title: "Live Demo — Interactive Restaurant OS Showcase",
	description:
		"Scroll through every screen of OrderWorder: the live menu gallery, kitchen display, tamper-proof audit chain, GST e-invoicing and 16 pages that run a restaurant. Try the interactive demo cart.",
	path: "/demo",
});

export default function DemoPage() {
	return <DemoGallery />;
}
