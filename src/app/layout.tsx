import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ThemeProvider } from "next-themes";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import SkipToContent from "@/components/base/SkipToContent";
import JsonLd from "@/components/seo/JsonLd";
import "./tailwind.css";

const inter = Inter({
        subsets: ["latin"],
        variable: "--font-sans",
        display: "swap",
});

const SITE_NAME = "OrderWorder";
const SITE_DESCRIPTION = "OrderWorder is India's first zero-commission QR ordering platform for restaurants. Scan, order, and pay — no app download needed. AI-powered recommendations, GST billing, and kitchen sync in one dashboard.";
const SITE_URL = "https://orderworder.com";
const SITE_TITLE = "OrderWorder — Contactless Restaurant Ordering & AI-Powered Dining | Scan, Order, Enjoy";

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
                default: SITE_TITLE,
        },
        description: SITE_DESCRIPTION,
        keywords: [
                "restaurant ordering",
                "QR menu",
                "contactless ordering",
                "zero commission",
                "GST billing",
                "AI restaurant",
                "OrderWorder",
                "digital menu",
                "restaurant SaaS",
                "India",
        ],
        authors: [{ name: "OrderWorder Team" }],
        category: "technology",
        openGraph: {
                title: SITE_TITLE,
                description: SITE_DESCRIPTION,
                type: "website",
                url: SITE_URL,
                siteName: SITE_NAME,
                locale: "en_IN",
        },
        twitter: {
                card: "summary_large_image",
                title: SITE_TITLE,
                description: SITE_DESCRIPTION,
                site: "@OrderWorder",
        },
        robots: {
                index: true,
                follow: true,
        },
};

export default function RootLayout({ children }: { children?: ReactNode }) {
        const organizationSchema = {
                "@context": "https://schema.org",
                "@type": "Organization",
                name: "OrderWorder",
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
                name: "OrderWorder",
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
                                <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true} disableTransitionOnChange>
                                        <JsonLd data={organizationSchema} />
                                        <JsonLd data={softwareSchema} />
                                        <JsonLd data={faqSchema} />
                                        <SkipToContent />
                                        {children}
                                </ThemeProvider>
                                <Toaster />
                        </body>
                </html>
        );
}
