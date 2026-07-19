import type { Metadata } from "next";
import type { ReactNode } from "react";
import PWARegister from "#components/base/PWARegister";
import { GlobalProvider } from "#components/context";
import { inter, montserrat } from "#utils/helper/fontHelper";
import { SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_URL } from "#utils/seo/constants";
import "./tailwind.css";
import "./globals.scss";

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
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

export default function RootLayout({ children }: IRootProps) {
	return (
		<html lang="en" className={`${inter.variable} ${montserrat.variable}`} suppressHydrationWarning>
			<body>
				<GlobalProvider>{children}</GlobalProvider>
				<PWARegister />
			</body>
		</html>
	);
}

interface IRootProps {
	children?: ReactNode;
}
