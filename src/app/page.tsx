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
import StudentDashboard from "@/components/student/StudentDashboard";
import EmployerDashboard from "@/components/employer/EmployerDashboard";

// Import your new Chatbot component
import Chatbot from "@/components/Chatbot";

/* ═══════════════════════════════════════════════════════════
   HOMEPAGE (landing page for signed-out users)
   ═══════════════════════════════════════════════════════════ */

function LandingPage() {
  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-950">
      {/* Global Brutalist Grid Background overlay */}
      <div
        className="fixed inset-0 z-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      ></div>

      <div className="relative z-10">
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
        <Chatbot userRole="guest" />
      </div>
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

  // Redirect signed-in users who haven't completed their Convex profile
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    // currentUser: undefined = loading, null = no record in Convex
    if (currentUser === null) {
      router.replace("/complete-profile");
    }
  }, [isLoaded, isSignedIn, currentUser, router]);

  // Loading state (Clerk not ready)
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

  // Signed-in but Convex profile is still loading or missing → show spinner
  // (the useEffect above will redirect to /complete-profile if null)
  if (!currentUser?.user?.role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Signed-in employer → show the employer dashboard AND the Chatbot
  if (currentUser.user.role === "employer") {
    return (
      <>
        <EmployerDashboard />
        <Chatbot userRole="employer" />
      </>
    );
  }

  // Signed-in student → show student view AND the Chatbot
  return (
    <>
      <StudentDashboard />
      <Chatbot userRole="student" />
    </>
  );
}
