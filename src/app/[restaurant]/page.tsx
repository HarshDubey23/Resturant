import { capitalize } from "lodash";
import { Compass, LogOut, Phone, Star, UtensilsCrossed } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ChatInterface } from "#components/chatbot/Chat";
import { CustomerProvider } from "#components/context";
import NavSideBar from "#components/layout/NavSideBar";
import JsonLd from "#components/seo/JsonLd";
import { getRestaurantProfile } from "#utils/database/helper/getRestaurantProfile";
import { SITE_NAME, SITE_URL } from "#utils/seo/constants";
import { buildMetadata } from "#utils/seo/metadata";

import PageContainer from "./_components/PageContainer";

const navItems = [
	{ label: "explore", value: "explore", icon: <Compass className="h-5 w-5" /> },
	{ label: "menu", value: "menu", icon: <UtensilsCrossed className="h-5 w-5" /> },
	{ label: "reviews", value: "reviews", icon: <Star className="h-5 w-5" /> },
	{ label: "contact", value: "contact", icon: <Phone className="h-5 w-5" /> },
	{ label: "sign out", value: "signout", icon: <LogOut className="h-5 w-5" /> },
];

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: IRestaurantProps): Promise<Metadata> {
	const { restaurant } = await params;
	let profile: Record<string, unknown> | null = null;
	try {
		profile = await getRestaurantProfile(restaurant);
	} catch {
		// DB unavailable during build
	}
	const name = (profile?.name as string) ?? capitalize(restaurant);
	const description =
		(profile?.description as string) ??
		`Order food online from ${name}. Browse the menu, customize your order, and enjoy contactless dining powered by ${SITE_NAME}.`;

	return buildMetadata({
		title: `${name} — Order Online`,
		description,
		path: `/${restaurant}`,
	});
}

const Restaurant = async ({ params }: IRestaurantProps) => {
	const { restaurant } = await params;
	let p: Record<string, unknown> | null = null;
	try {
		p = await getRestaurantProfile(restaurant);
	} catch {
		// DB unavailable during build
	}

	if (!p) {
		notFound();
	}

	const profile = p as { name?: string; description?: string; address?: string; cover?: string; categories?: string[] } | null;
	const name = profile?.name ?? capitalize(restaurant);

	return (
		<CustomerProvider>
			<JsonLd
				data={{
					"@context": "https://schema.org",
					"@type": "Restaurant",
					name,
					url: `${SITE_URL}/${restaurant}`,
					...(profile?.description && { description: profile.description }),
					...(profile?.address && { address: { "@type": "PostalAddress", streetAddress: profile.address } }),
					...(profile?.cover && { image: profile.cover }),
					...(profile?.categories?.length && { servesCuisine: profile.categories }),
					hasMenu: { "@type": "Menu", url: `${SITE_URL}/${restaurant}?tab=menu` },
					potentialAction: {
						"@type": "OrderAction",
						target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/${restaurant}?tab=menu` },
					},
				}}
			/>
			<div className="flex w-full h-screen overflow-hidden">
				<NavSideBar navItems={navItems} defaultTab="menu" foot />
				<div className="flex-1 overflow-hidden">
					<PageContainer />
					<ChatInterface />
				</div>
			</div>
		</CustomerProvider>
	);
};

export default Restaurant;

interface IRestaurantProps {
	params: Promise<{ restaurant: string }>;
	searchParams: Promise<{ tab?: string; [key: string]: string | undefined }>;
}
