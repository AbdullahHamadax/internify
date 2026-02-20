"use client";

import { useClerk, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

export function AuthControls() {
  const router = useRouter();
  const { signOut } = useClerk();
  const { isLoaded, isSignedIn, user } = useUser();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return null;
  }

  const name =
    user?.firstName || user?.fullName || user?.username || "there";

  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-700 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
      <span className="whitespace-nowrap">Hello, {name}</span>
      <button
        type="button"
        onClick={async () => {
          await signOut();
          router.push("/login");
        }}
        className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
      >
        Sign out
      </button>
    </div>
  );
}
