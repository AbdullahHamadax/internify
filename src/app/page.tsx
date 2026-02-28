"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";

import { api } from "../../convex/_generated/api";

import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import StatsBar from "@/components/landing/StatsBar";
import HowItWorks from "@/components/landing/HowItWorks";
import AudienceSection from "@/components/landing/AudienceSection";
import PartnerLogos from "@/components/landing/PartnerLogos";
import CtaSection from "@/components/landing/CtaSection";
import Footer from "@/components/landing/Footer";
import SignedInView from "@/components/SignedInView";

/* ═══════════════════════════════════════════════════════════
   HOMEPAGE (landing page for signed-out users)
   ═══════════════════════════════════════════════════════════ */

function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />
      <main>
        <HeroSection />
        <StatsBar />
        <HowItWorks />
        <AudienceSection />
        <PartnerLogos />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   ROOT COMPONENT
   ═══════════════════════════════════════════════════════════ */

export default function Home() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const currentUser = useQuery(api.users.currentUser);

  // Redirect OAuth users who haven't completed their profile
  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }
    if (currentUser === null) {
      router.replace("/complete-profile");
    }
  }, [isLoaded, isSignedIn, currentUser, router]);

  // Loading state
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Signed-out → show the marketing landing page
  if (!isSignedIn) {
    return <LandingPage />;
  }

  // Signed-in → show the dashboard view (preserved from original)
  return <SignedInView />;
}
