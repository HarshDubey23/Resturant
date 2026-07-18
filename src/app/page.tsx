import { DashboardProvider } from "#components/context";
import JsonLd from "#components/seo/JsonLd";
import { getThemeColor } from "#utils/database/helper/getThemeColor";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "#utils/seo/constants";
import { buildMetadata } from "#utils/seo/metadata";
import PageContainer from "./_homepage/PageContainer";

export const metadata = buildMetadata({
	title: "Contactless Restaurant Ordering & AI-Powered Dining",
	description: SITE_DESCRIPTION,
	path: "/",
});

export default async function Homepage() {
	const themeColor = await getThemeColor();

	return (
		<DashboardProvider>
			<script
				dangerouslySetInnerHTML={{
					__html: `
            (function(){
              var c = ${JSON.stringify(themeColor ?? "#6d28d9")};
              var r = document.documentElement;
              r.style.setProperty("--primary", c);
              var h = c.match(/[\\da-f]{2}$/i) ? parseInt(c.slice(-2),16) : 128;
              r.style.setProperty("--primary-foreground", h > 128 ? "#000" : "#fff");
            })();
          `,
				}}
				suppressHydrationWarning
			/>
			<JsonLd
				data={{
					"@context": "https://schema.org",
					"@type": "WebApplication",
					name: SITE_NAME,
					url: SITE_URL,
					description: SITE_DESCRIPTION,
					applicationCategory: "BusinessApplication",
					operatingSystem: "Web",
					offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
					publisher: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
				}}
			/>
			<PageContainer />
		</DashboardProvider>
	);
}
