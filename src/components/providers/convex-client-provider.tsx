"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { ConvexReactClient, useConvexAuth, useQuery } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ReactNode, useMemo } from "react";
import usePresence from "@convex-dev/presence/react";
import { api } from "../../../convex/_generated/api";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is missing from environment.");
}

const convex = new ConvexReactClient(convexUrl);

/**
 * Workaround for a stale-closure bug in ConvexProviderWithClerk.
 *
 * The provider checks `sessionClaims?.aud === "convex"` to decide whether to
 * call `getToken()` (automatic Clerk integration) or
 * `getToken({ template: "convex" })` (legacy JWT template).
 *
 * Problem: `sessionClaims` is captured inside a `useCallback` whose deps are
 * only `[orgId, orgRole]`. After `setActive()` during login, `sessionClaims`
 * updates to `{ aud: "convex" }` but the callback keeps the OLD closure value
 * (`undefined`), so it takes the legacy branch and calls a template that no
 * longer exists → token is null → Convex never authenticates.
 *
 * Fix: always surface `aud: "convex"` in `sessionClaims` so even the stale
 * closure takes the correct branch.
 */
function useAuthWithConvexAud() {
  const auth = useAuth();
  return useMemo(
    () => ({
      ...auth,
      sessionClaims: { ...auth.sessionClaims, aud: "convex" as const },
    }),
    [auth],
  );
}

function GlobalPresenceAnnouncer({ userId }: { userId: string }) {
  usePresence(api.presence, "global:online", userId, 10000);
  return null;
}

function GlobalPresence() {
  const { user } = useUser();
  const { isAuthenticated, isLoading } = useConvexAuth();
  const currentUser = useQuery(
    api.users.currentUser,
    !isLoading && isAuthenticated ? {} : "skip",
  );
  const userId = currentUser?.user?._id;

  if (!user || !userId) return null;
  return <GlobalPresenceAnnouncer userId={userId} />;
}

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuthWithConvexAud}>
      <GlobalPresence />
      {children}
    </ConvexProviderWithClerk>
  );
}
