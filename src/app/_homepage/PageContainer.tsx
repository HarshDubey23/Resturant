"use client";

import AboutSection from "@/components/sections/AboutSection";
import AnnouncementBar from "@/components/sections/AnnouncementBar";
import BackToTopButton from "@/components/sections/BackToTopButton";
import BlogTeaserSection from "@/components/sections/BlogTeaserSection";
import CartDrawer from "@/components/sections/CartDrawer";
import CartFab from "@/components/sections/CartFab";
import ComparisonSection from "@/components/sections/ComparisonSection";
import CookieConsentBanner from "@/components/sections/CookieConsentBanner";
import CtaSection from "@/components/sections/CtaSection";
import FAQSection from "@/components/sections/FAQSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import FooterSection from "@/components/sections/FooterSection";
import HeroSection from "@/components/sections/HeroSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import LiveActivityFeed from "@/components/sections/LiveActivityFeed";
import LiveOrderCounter from "@/components/sections/LiveOrderCounter";
import LoginSection from "@/components/sections/LoginSection";
import MenuSection from "@/components/sections/MenuSection";
import Navbar from "@/components/sections/Navbar";
import NewsletterSection from "@/components/sections/NewsletterSection";
import PartnersStripSection from "@/components/sections/PartnersStripSection";
import PlatformVisionSection from "@/components/sections/PlatformVisionSection";
import PricingFAQSection from "@/components/sections/PricingFAQSection";
import PricingSection from "@/components/sections/PricingSection";
import SavingsCalculator from "@/components/sections/SavingsCalculator";
import ScrollProgressBar from "@/components/sections/ScrollProgressBar";
import SectionProgressIndicator from "@/components/sections/SectionProgressIndicator";
import StatsBarSection from "@/components/sections/StatsBarSection";
import StickyCTABar from "@/components/sections/StickyCTABar";
import TeamSection from "@/components/sections/TeamSection";
import TestimonialsSection from "@/components/sections/TestimonialsSection";
import TrustBadges from "@/components/sections/TrustBadges";
import RestaurantTypeSelector from "@/components/sections/RestaurantTypeSelector";
import ChatBot from "@/components/chatbot/ChatBotWidget";

export default function PageContainer() {
        const scrollToLogin = () => {
                document.getElementById("login")?.scrollIntoView({ behavior: "smooth" });
        };

        return (
                <div className="min-h-screen flex flex-col">
                        <ScrollProgressBar />
                        <AnnouncementBar />
                        <Navbar onLoginClick={scrollToLogin} />
                        <main id="main-content" className="flex-1">
                                <HeroSection />
                                <StatsBarSection />
                                <TrustBadges />
                                <PartnersStripSection />
                                <FeaturesSection />
                                <PlatformVisionSection />
                                <HowItWorksSection />
                                <MenuSection />
                                <TestimonialsSection />
                                <RestaurantTypeSelector />
                                <PricingSection />
                                <PricingFAQSection />
                                <ComparisonSection />
                                <SavingsCalculator />
                                <FAQSection />
                                <AboutSection />
                                <TeamSection />
                                <BlogTeaserSection />
                                <LoginSection />
                                <NewsletterSection />
                                <CtaSection />
                                <FooterSection />
                        </main>
                        <SectionProgressIndicator />
                        <ChatBot />
                        <CartFab />
                        <CartDrawer />
                        <LiveOrderCounter />
                        <LiveActivityFeed />
                        <BackToTopButton />
                        <StickyCTABar />
                        <CookieConsentBanner />
                </div>
        );
}
