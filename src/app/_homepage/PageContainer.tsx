"use client";

import AboutSection from "@/components/sections/AboutSection";
import CtaSection from "@/components/sections/CtaSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import FooterSection from "@/components/sections/FooterSection";
import HeroSection from "@/components/sections/HeroSection";
import LoginSection from "@/components/sections/LoginSection";
import Navbar from "@/components/sections/Navbar";

export default function PageContainer() {
	const scrollToLogin = () => {
		document.getElementById("login")?.scrollIntoView({ behavior: "smooth" });
	};

	return (
		<div>
			<Navbar onLoginClick={scrollToLogin} />
			<main>
				<HeroSection onCtaClick={scrollToLogin} />
				<FeaturesSection />
				<AboutSection />
				<LoginSection />
				<CtaSection onCtaClick={scrollToLogin} />
				<FooterSection />
			</main>
		</div>
	);
}
