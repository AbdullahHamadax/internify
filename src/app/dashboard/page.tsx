"use client";

import { useEffect } from "react";
import {
  AuthLoading,
  Authenticated,
  Unauthenticated,
  useMutation,
  useQuery,
} from "convex/react";
import { useRouter } from "next/navigation";

import { api } from "../../../convex/_generated/api";

import Chatbot from "@/components/Chatbot";
import EmployerDashboard from "@/components/employer/EmployerDashboard";
import { ProfileModalProvider } from "@/components/shared/ProfileModalContext";
import StudentDashboard from "@/components/student/StudentDashboard";

const EXPIRED_TASK_CLEANUP_POLL_MS = 5 * 60 * 1000;

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
  const cleanupExpiredTaskData = useMutation(api.tasks.cleanupExpiredTaskData);

  useEffect(() => {
    if (currentUser === null) {
      router.replace("/complete-profile");
    }
  }, [currentUser, router]);

  useEffect(() => {
    if (!currentUser?.user._id) return;

    const runCleanup = () =>
      cleanupExpiredTaskData().catch((error) => {
        console.error("Expired task cleanup failed; retrying later.", error);
      });

    void runCleanup();

    const cleanupInterval = window.setInterval(() => {
      void runCleanup();
    }, EXPIRED_TASK_CLEANUP_POLL_MS);

    return () => window.clearInterval(cleanupInterval);
  }, [cleanupExpiredTaskData, currentUser?.user._id]);

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
