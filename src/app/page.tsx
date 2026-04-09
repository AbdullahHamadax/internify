"use client";

import { useEffect } from "react";
import { AuthLoading, Authenticated, Unauthenticated, useQuery } from "convex/react";
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
import Chatbot from "@/components/Chatbot";

function LandingPage({
  userRole = "guest",
}: {
  userRole?: "guest" | "student" | "employer";
}) {
  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-950">
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-10"
        style={{
          backgroundImage:
            "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      <div className="relative z-10">
        <Navbar authenticatedRole={userRole === "guest" ? undefined : userRole} />
        <main>
          <HeroSection />
          <StatsBar />
          <HowItWorks />
          <AudienceSection />
          <PartnerLogos />
          <CtaSection />
        </main>
        <Footer />
        <Chatbot userRole={userRole} />
      </div>
    </div>
  );
}

function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function AuthenticatedLanding() {
  const router = useRouter();
  const currentUser = useQuery(api.users.currentUser);

  useEffect(() => {
    if (currentUser === null) {
      router.replace("/complete-profile");
    }
  }, [currentUser, router]);

  if (currentUser === undefined || currentUser === null) {
    return <FullScreenSpinner />;
  }

  return <LandingPage userRole={currentUser.user.role} />;
}

export default function Home() {
  return (
    <>
      <AuthLoading>
        <FullScreenSpinner />
      </AuthLoading>
      <Unauthenticated>
        <LandingPage userRole="guest" />
      </Unauthenticated>
      <Authenticated>
        <AuthenticatedLanding />
      </Authenticated>
    </>
  );
}
