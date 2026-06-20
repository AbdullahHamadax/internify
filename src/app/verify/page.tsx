"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck, Search, ArrowLeft } from "lucide-react";
import { Typography } from "@/components/ui/Typography";

/**
 * Public certificate verification entry point. Anyone can type a certificate ID
 * (e.g. "INF-2026-7K4QX9") and be taken to its verification result. No account
 * required — this is the lookup the certificate's printed ID points to.
 */
export default function VerifyLandingPage() {
  const router = useRouter();
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = value.trim().toUpperCase().replace(/\s+/g, "");
    if (!id) return;
    router.push(`/verify/${encodeURIComponent(id)}`);
  };

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 flex items-center justify-center border-4 border-border bg-[#047857] text-white shadow-[4px_4px_0_0_var(--border)] mb-6">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <Typography
            variant="h1"
            className="font-black uppercase tracking-widest mb-3"
          >
            Verify a Certificate
          </Typography>
          <p className="text-muted-foreground font-medium">
            Enter the certificate ID exactly as it appears on the document to
            confirm it was issued by Internify.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="border-4 border-border bg-card shadow-[8px_8px_0_0_var(--border)] p-6 sm:p-8 space-y-4"
        >
          <label
            htmlFor="certificateId"
            className="block text-xs font-black uppercase tracking-widest text-muted-foreground"
          >
            Certificate ID
          </label>
          <input
            id="certificateId"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="INF-2026-7K4QX9"
            autoComplete="off"
            spellCheck={false}
            className="w-full border-2 border-border bg-background px-4 py-3 font-bold tracking-widest uppercase placeholder:text-muted-foreground/50 placeholder:tracking-widest focus:outline-none focus:shadow-[2px_2px_0_0_var(--border)] transition-shadow"
          />
          <button
            type="submit"
            disabled={!value.trim()}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-foreground text-background border-2 border-border font-black uppercase tracking-widest text-sm hover:translate-x-[2px] hover:translate-y-[2px] shadow-[4px_4px_0_0_var(--border)] hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_0_var(--border)]"
          >
            <Search className="w-4 h-4" />
            Verify
          </button>
        </form>
      </div>
    </main>
  );
}
