"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { GraduationCap, LogIn, LogOut, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { api } from "../../convex/_generated/api";

export default function Home() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { isLoaded, isSignedIn, user } = useUser();
  const currentUser = useQuery(api.users.currentUser);

  // ── Loading state ──
  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // ── Signed-out view ──
  if (!isSignedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm space-y-8 text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="bg-brand-gradient p-2.5 rounded-xl shadow-lg">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-wide">Internify</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Welcome to Internify</h1>
            <p className="text-muted-foreground">
              Sign in to your account or create a new one to get started.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
            >
              <LogIn className="h-4 w-4" />
              Sign In
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-6 py-3 text-sm font-semibold text-zinc-800 shadow-sm transition-colors hover:bg-zinc-50"
            >
              <UserPlus className="h-4 w-4" />
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Signed-in view ──
  const firstName =
    user?.firstName || user?.fullName || user?.username || "there";
  const role = currentUser?.user?.role;
  const roleBadgeClass =
    role === "employer"
      ? "bg-purple-100 text-purple-700"
      : "bg-blue-100 text-blue-700";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="flex items-center justify-center gap-3">
          <div className="bg-brand-gradient p-2.5 rounded-xl shadow-lg">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <span className="text-2xl font-bold tracking-wide">Internify</span>
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-bold">
            Hello, {firstName}!
          </h1>

          {role ? (
            <span
              className={`inline-block rounded-full px-4 py-1.5 text-sm font-semibold capitalize ${roleBadgeClass}`}
            >
              {role}
            </span>
          ) : (
            <p className="text-sm text-muted-foreground">
              Loading your profile…
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => signOut()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-zinc-700"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
