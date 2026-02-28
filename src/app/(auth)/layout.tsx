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
            className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/80 px-4 py-2 text-sm font-semibold text-slate-900 shadow-sm backdrop-blur transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md dark:border-white/10 dark:bg-slate-900/80 dark:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Home
          </Link>
          <ThemeToggle />
        </div>
      </div>

      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="relative hidden overflow-hidden bg-[linear-gradient(135deg,#06b6d4_0%,#3b82f6_50%,#a855f7_100%)] p-12 pt-28 text-white dark:bg-[linear-gradient(135deg,#082f49_0%,#1d4ed8_45%,#6b21a8_100%)] lg:flex lg:flex-col lg:justify-between">
          <div className="absolute top-20 -right-12.5 h-64 w-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12.5 -left-12.5 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex items-center gap-3 text-2xl font-bold">
            <div className="rounded-xl border border-white/30 bg-white/20 p-2.5 shadow-lg backdrop-blur-md">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="tracking-wide">Internify</span>
          </div>

          <AuthHero />

          <div className="relative z-10 text-xs font-medium uppercase tracking-wider text-blue-100/70">
            (c) 2026 Internify Platform
          </div>
        </div>

        <div className="flex min-h-screen items-center justify-center bg-background px-6 pb-8 pt-24 dark:bg-gray-950 lg:p-12 lg:pt-12">
          <div className="w-full max-w-110">
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
