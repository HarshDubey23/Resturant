import type { Metadata } from "next";
import type { ReactNode } from "react";
import SkipToContent from "@/components/base/SkipToContent";
import { GlobalProvider } from "@/components/context";
import { inter } from "@/utils/helper/fontHelper";
import JsonLd from "@/components/seo/JsonLd";
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_URL } from "@/utils/seo/constants";
import { Toaster } from "@/components/ui/sonner";
import "./tailwind.css";

function getMetadataBase(): URL {
	try {
		return new URL(SITE_URL);
	} catch {
		return new URL("http://localhost:3000");
	}
}

export const metadata: Metadata = {
	metadataBase: getMetadataBase(),
	title: {
		template: `%s | ${SITE_NAME}`,
		default: `${SITE_NAME} — Contactless Restaurant Ordering & AI-Powered Dining`,
	},
	description: SITE_DESCRIPTION,
	keywords: [...SITE_KEYWORDS],
	openGraph: {
		type: "website",
		locale: "en_US",
		siteName: SITE_NAME,
	},
	twitter: { card: "summary_large_image" },
	robots: {
		index: true,
		follow: true,
		"max-image-preview": "large",
		"max-snippet": -1,
		"max-video-preview": -1,
	},
};

interface IRootProps {
	children?: ReactNode;
}

export default function RootLayout({ children }: IRootProps) {
	const organizationSchema = {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: SITE_NAME,
		url: SITE_URL,
		description: SITE_DESCRIPTION,
		logo: `${SITE_URL}/icon-512.png`,
		sameAs: [
			"https://twitter.com/OrderWorder",
			"https://www.linkedin.com/company/orderworder",
		],
		contactPoint: {
			"@type": "ContactPoint",
			contactType: "sales",
			email: "hello@orderworder.com",
			availableLanguage: ["English", "Hindi"],
		},
	};

	const softwareSchema = {
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		name: SITE_NAME,
		applicationCategory: "BusinessApplication",
		applicationSubCategory: "Restaurant Management Software",
		operatingSystem: "Web",
		offers: [
			{
				"@type": "Offer",
				name: "Starter",
				price: "999",
				priceCurrency: "INR",
				description: "Up to 5 tables, basic QR ordering, kitchen display.",
			},
			{
				"@type": "Offer",
				name: "Pro",
				price: "2999",
				priceCurrency: "INR",
				description: "Up to 20 tables, AI recommendations, advanced analytics, WhatsApp campaigns.",
			},
		],
		aggregateRating: {
			"@type": "AggregateRating",
			ratingValue: "4.9",
			ratingCount: "500",
		},
	};

	const faqSchema = {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: [
			{
				"@type": "Question",
				name: "Do customers need to download an app?",
				acceptedAnswer: {
					"@type": "Answer",
					text: "No. Customers scan a QR code at their table and the menu opens in their phone's browser instantly. No download, no login required.",
				},
			},
			{
				"@type": "Question",
				name: "How long does setup take?",
				acceptedAnswer: {
					"@type": "Answer",
					text: "Most restaurants are live in under 10 minutes. Add your menu, generate QR codes for each table, print and place them — you're ready.",
				},
			},
			{
				"@type": "Question",
				name: "What payment methods are supported?",
				acceptedAnswer: {
					"@type": "Answer",
					text: "Razorpay and Stripe are integrated out of the box. Customers can pay via UPI, credit/debit cards, wallets, and net banking.",
				},
			},
			{
				"@type": "Question",
				name: "Do you charge per-order commission?",
				acceptedAnswer: {
					"@type": "Answer",
					text: "No. Unlike food delivery apps, we charge a flat monthly subscription. Keep 100% of every order.",
				},
			},
			{
				"@type": "Question",
				name: "What if internet goes down?",
				acceptedAnswer: {
					"@type": "Answer",
					text: "The kitchen display and cashier work offline. Orders sync automatically when connection returns. No lost tickets.",
				},
			},
		],
	};

	return (
		<html lang="en" className={`${inter.variable}`} suppressHydrationWarning>
			<body className="antialiased">
				<GlobalProvider>
					<JsonLd data={organizationSchema} />
					<JsonLd data={softwareSchema} />
					<JsonLd data={faqSchema} />
					<SkipToContent />
					{children}
				</GlobalProvider>
				<Toaster />
			</body>
		</html>
	);
}
