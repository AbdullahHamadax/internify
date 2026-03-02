"use client";

import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { Suspense } from "react"; // 1. Import Suspense

export default function SSOCallbackPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Completing sign-in...</p>

      {/* 2. Wrap the Clerk component in Suspense */}
      <Suspense fallback={null}>
        <AuthenticateWithRedirectCallback />
      </Suspense>

      {/* Required when Clerk's bot sign-up protection is enabled */}
      <div id="clerk-captcha" />
    </div>
  );
}
