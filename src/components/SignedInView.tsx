"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { Typography } from "@/components/ui/Typography";
import { GraduationCap, LogOut } from "lucide-react";

import { api } from "../../convex/_generated/api";

export default function SignedInView() {
  const { signOut } = useClerk();
  const { user } = useUser();
  const currentUser = useQuery(api.users.currentUser);

  if (currentUser === undefined || currentUser === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const firstName =
    user?.firstName || user?.fullName || user?.username || "there";
  const role = currentUser?.user?.role;
  const roleBadgeClass =
    role === "employer"
      ? "bg-purple-100 text-purple-700"
      : "bg-blue-100 text-blue-700";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground p-6">
      <div className="w-full max-w-sm space-y-8 text-center">
        <div className="flex items-center justify-center gap-3">
          <div className="bg-brand-gradient p-2.5 rounded-xl shadow-lg">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <Typography variant="h3" as="span" className="tracking-wide">
            Internify
          </Typography>
        </div>

        <div className="space-y-3">
          <Typography variant="h2" as="h1">
            Hello, {firstName}!
          </Typography>
          {role ? (
            <span
              className={`inline-block rounded-full px-4 py-1.5 text-sm font-semibold capitalize ${roleBadgeClass}`}
            >
              {role}
            </span>
          ) : (
            <Typography variant="span" color="muted">
              Loading your profile…
            </Typography>
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
