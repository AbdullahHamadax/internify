"use client";

import { useConvexAuth } from "convex/react";

export function useConvexTokenReady() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  return !isLoading && isAuthenticated;
}
