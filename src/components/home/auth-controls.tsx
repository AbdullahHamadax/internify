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
    <div className="inline-flex items-center gap-3 rounded-none border-2 border-black dark:border-white bg-white px-3 py-1.5 text-sm text-black shadow-[4px_4px_0_0_#000] dark:bg-black dark:text-white dark:shadow-[4px_4px_0_0_#fff]">
      <span className="whitespace-nowrap font-bold uppercase tracking-widest text-xs">Hello, {name}</span>
      <button
        type="button"
        onClick={async () => {
          await signOut();
          router.push("/login");
        }}
        className="rounded-none border-2 border-black dark:border-white bg-[#FF3366] px-3 py-1 text-xs font-black uppercase tracking-widest text-white transition-all shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0_0_#000] dark:hover:shadow-[4px_4px_0_0_#fff]"
      >
        Sign out
      </button>
    </div>
  );
}
