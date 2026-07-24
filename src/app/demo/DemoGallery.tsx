"use client";

import { AmbianceCarousel } from "./_components/AmbianceCarousel";
import { CartProvider } from "./_components/CartContext";
import { DemoFooter } from "./_components/DemoFooter";
import { DemoNavbar } from "./_components/DemoNavbar";
import { FeatureTiles } from "./_components/FeatureTiles";
import { HashChainSection } from "./_components/HashChainSection";
import { HeroDemo } from "./_components/HeroDemo";
import { FloatingCartBadge, MenuGallery } from "./_components/MenuGallery";
import { PageShowcase } from "./_components/PageShowcase";
import { StickyCTA } from "./_components/StickyCTA";

export function DemoGallery() {
	return (
		<CartProvider>
			<DemoNavbar />
			<main className="min-h-screen flex flex-col">
				<HeroDemo />
				<MenuGallery />
				<AmbianceCarousel />
				<PageShowcase />
				<FeatureTiles />
				<HashChainSection />
				<DemoFooter />
			</main>
			<FloatingCartBadge />
			<StickyCTA />
		</CartProvider>
	);
}
