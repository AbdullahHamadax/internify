"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ReactNode } from "react";
import usePresence from "@convex-dev/presence/react";
import { api } from "../../../convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is missing from environment.");
}

const convex = new ConvexReactClient(convexUrl);

function GlobalPresenceAnnouncer({ userName }: { userName: string }) {
  usePresence(api.presence, "global:online", userName, 10000);
  return null;
}

function GlobalPresence() {
  const { user } = useUser();
  const userName = user?.fullName || user?.username;
  if (!userName) return null;
  return <GlobalPresenceAnnouncer userName={userName} />;
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <GlobalPresence />
      {children}
    </ConvexProviderWithClerk>
  );
}
