import { AuthHero } from "@/components/auth/auth-hero";
import { GraduationCap } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="w-full min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-[linear-gradient(135deg,#06b6d4_0%,#3b82f6_50%,#a855f7_100%)] p-12 text-white relative overflow-hidden">
        <div className="absolute top-20 -right-12.5 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12.5 -left-12.5 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3 font-bold text-2xl relative z-10">
          <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md border border-white/30 shadow-lg">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <span className="tracking-wide">Internify</span>
        </div>

        <AuthHero />

        <div className="text-xs text-blue-100/70 relative z-10 font-medium uppercase tracking-wider">
          (c) 2026 Internify Platform
        </div>
      </div>

      <div className="flex items-center justify-center bg-background p-6 lg:p-12">
        <div className="w-full max-w-110">{children}</div>
      </div>
    </div>
  );
}
