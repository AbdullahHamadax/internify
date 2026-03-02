// 1. REMOVE "use client" so this becomes a Server Component
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

// 2. Tell Next.js to NEVER statically build this page, bypassing the error entirely
export const dynamic = "force-dynamic";

export default function SSOCallbackPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">Completing sign-in...</p>

      {/* Clerk handles its own client-side logic internally */}
      <AuthenticateWithRedirectCallback />

      {/* Required when Clerk's bot sign-up protection is enabled */}
      <div id="clerk-captcha" />
    </div>
  );
}
