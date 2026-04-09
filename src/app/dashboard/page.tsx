"use client";

import { useEffect } from "react";
import { AuthLoading, Authenticated, Unauthenticated, useQuery } from "convex/react";
import { useRouter } from "next/navigation";

import { api } from "../../../convex/_generated/api";

import Chatbot from "@/components/Chatbot";
import EmployerDashboard from "@/components/employer/EmployerDashboard";
import { ProfileModalProvider } from "@/components/shared/ProfileModalContext";
import StudentDashboard from "@/components/student/StudentDashboard";

function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return <FullScreenSpinner />;
}

function AuthenticatedDashboard() {
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

  if (currentUser.user.role === "employer") {
    return (
      <ProfileModalProvider>
        <EmployerDashboard />
        <Chatbot userRole="employer" />
      </ProfileModalProvider>
    );
  }

  return (
    <ProfileModalProvider>
      <StudentDashboard />
      <Chatbot userRole="student" />
    </ProfileModalProvider>
  );
}

export default function DashboardPage() {
  return (
    <>
      <AuthLoading>
        <FullScreenSpinner />
      </AuthLoading>
      <Unauthenticated>
        <DashboardRedirect />
      </Unauthenticated>
      <Authenticated>
        <AuthenticatedDashboard />
      </Authenticated>
    </>
  );
}
