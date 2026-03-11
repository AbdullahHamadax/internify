// app/(auth)/layout.tsx
import { AuthHero } from "@/components/auth/auth-hero";
import ThemeToggle from "@/components/ThemeToggle";
import { ArrowLeft, GraduationCap, Loader2 } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen bg-background text-foreground dark:bg-gray-950">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-center justify-end p-4 sm:p-6">
        <div className="pointer-events-auto flex items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-none border-2 border-black dark:border-white bg-white text-black dark:bg-black dark:text-white px-4 py-2 text-sm font-black uppercase tracking-widest transition-all shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] hover:-translate-y-px hover:-translate-x-px hover:shadow-[4px_4px_0_0_#000] dark:hover:shadow-[4px_4px_0_0_#fff]"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="relative overflow-hidden bg-[#FCD34D] border-r-4 border-black dark:border-white p-12 pt-28 text-black hidden lg:flex lg:flex-col lg:justify-between">
          {/* Brutalist geometric background shapes */}
          <div
            className="absolute top-0 left-0 w-full h-full z-0 opacity-20 pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="absolute top-1/4 -right-20 w-[600px] h-[600px] bg-[#3B82F6] rotate-12 z-0 border-4 border-black box-content shadow-[16px_16px_0_0_rgba(0,0,0,1)] dark:border-white dark:shadow-[16px_16px_0_0_rgba(255,255,255,1)]" />
          <div className="absolute bottom-10 left-10 w-64 h-64 bg-[#AB47BC] -rotate-6 z-0 border-4 border-black shadow-[12px_12px_0_0_rgba(0,0,0,1)] dark:border-white dark:shadow-[12px_12px_0_0_rgba(255,255,255,1)]" />

          <div className="relative z-10 flex items-center gap-3 text-2xl font-black uppercase tracking-widest text-black dark:text-white">
            <div className="border-4 border-black dark:border-white bg-white dark:bg-black p-2.5 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]">
              <GraduationCap className="h-6 w-6 text-black dark:text-white" />
            </div>
            <span>Internify</span>
          </div>

          <Suspense fallback={null}>
            <AuthHero />
          </Suspense>

          <div className="relative z-10 text-xs font-black uppercase tracking-widest text-white">
            (c) 2026 INTERNIFY PLATFORM
          </div>
        </div>

        <div className="flex min-h-screen items-center justify-center bg-background px-6 pb-8 pt-24 dark:bg-gray-950 lg:p-12 lg:pt-12">
          <div className="w-full max-w-lg">
            <Suspense
              fallback={
                <div className="flex h-100 items-center justify-center">
                  <Loader2 className="animate-spin text-muted-foreground" />
                </div>
              }
            >
              {children}
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
