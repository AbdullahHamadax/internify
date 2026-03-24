"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { useQuery } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ReactNode } from "react";
import usePresence from "@convex-dev/presence/react";
import { api } from "../../../convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is missing from environment.");
}

const convex = new ConvexReactClient(convexUrl);

function GlobalPresenceAnnouncer({ userId }: { userId: string }) {
  usePresence(api.presence, "global:online", userId, 10000);
  return null;
}

function GlobalPresence() {
  const { user } = useUser();
  const currentUser = useQuery(api.users.currentUser);
  const userId = currentUser?.user?._id;

  if (!user || !userId) return null;
  return <GlobalPresenceAnnouncer userId={userId} />;
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <GlobalPresence />
      {children}
    </ConvexProviderWithClerk>
  );
}
