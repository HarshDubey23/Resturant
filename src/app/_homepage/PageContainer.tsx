"use client";

import AboutSection from "@/components/sections/AboutSection";
import CtaSection from "@/components/sections/CtaSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import FooterSection from "@/components/sections/FooterSection";
import HeroSection from "@/components/sections/HeroSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import LoginSection from "@/components/sections/LoginSection";
import Navbar from "@/components/sections/Navbar";
import PlatformVisionSection from "@/components/sections/PlatformVisionSection";
import PricingSection from "@/components/sections/PricingSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";

export default function PageContainer() {
        const scrollToLogin = () => {
                document.getElementById("login")?.scrollIntoView({ behavior: "smooth" });
        };

        return (
                <div>
                        <Navbar onLoginClick={scrollToLogin} />
                        <main>
                                <HeroSection />
                                <FeaturesSection />
                                <PlatformVisionSection />
                                <HowItWorksSection />
                                <TestimonialsSection />
                                <PricingSection />
                                <AboutSection />
                                <LoginSection />
                                <CtaSection />
                                <FooterSection />
                        </main>
                </div>
        );
}
