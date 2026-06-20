"use client";

import Link from "next/link";
import { useConvexAuth, useQuery } from "convex/react";
import {
  BadgeCheck,
  Building2,
  Calendar,
  Loader2,
  ShieldX,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { api } from "../../../convex/_generated/api";
import { Typography } from "@/components/ui/Typography";

function scoreLabel(score: number): string {
  if (score >= 90) return "EXCELLENT";
  if (score >= 75) return "GOOD";
  if (score >= 60) return "SATISFACTORY";
  return "PASS";
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Public certificate verification result. Calls the unauthenticated Convex
 * query, then renders a loading, not-found, or verified state. Mounted by the
 * /verify/[certificateId] route so anyone with a certificate ID can confirm it.
 */
export default function CertificateVerifier({
  certificateId,
}: {
  certificateId: string;
}) {
  const result = useQuery(api.certificates.getCertificateByPublicId, {
    certificateId,
  });
  // The full profile page requires login (it exposes email/phone/CV), so only
  // offer the link to signed-in viewers — external recruiters verifying a cert
  // shouldn't be bounced to a login wall.
  const { isAuthenticated } = useConvexAuth();

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center px-4 py-12 sm:py-20">
      <div className="w-full max-w-2xl">
        <Link
          href="/verify"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Verify another certificate
        </Link>

        {/* Loading */}
        {result === undefined && (
          <div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm font-bold uppercase tracking-widest">
              Checking certificate…
            </span>
          </div>
        )}

        {/* Not found */}
        {result && !result.found && (
          <div className="border-4 border-border bg-card shadow-[8px_8px_0_0_var(--border)] p-8 sm:p-10 text-center">
            <div className="mx-auto w-16 h-16 flex items-center justify-center border-4 border-border bg-[#F43F5E] text-white shadow-[4px_4px_0_0_var(--border)] mb-6">
              <ShieldX className="w-8 h-8" />
            </div>
            <Typography
              variant="h2"
              className="font-black uppercase tracking-widest mb-3"
            >
              Not Verified
            </Typography>
            <p className="text-muted-foreground font-medium">
              No certificate matches the ID{" "}
              <span className="font-black text-foreground break-all">
                {certificateId}
              </span>
              . Double-check the ID exactly as it appears on the certificate.
            </p>
          </div>
        )}

        {/* Verified */}
        {result && result.found && (
          <div className="border-4 border-border bg-card shadow-[8px_8px_0_0_var(--border)] overflow-hidden">
            {/* Verified banner */}
            <div className="bg-[#047857] text-white px-6 sm:px-8 py-5 border-b-4 border-border flex items-center gap-3">
              <BadgeCheck className="w-7 h-7 shrink-0" />
              <div>
                <Typography
                  variant="h3"
                  className="font-black uppercase tracking-widest leading-none"
                >
                  Verified Certificate
                </Typography>
                <p className="text-xs font-bold uppercase tracking-widest text-white/80 mt-1">
                  Issued by Internify
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Student + score */}
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">
                    Awarded to
                  </p>
                  <Typography variant="h2" className="font-black">
                    {result.studentName}
                  </Typography>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">
                    Final Score
                  </p>
                  <p className="text-3xl font-black leading-none">
                    {result.finalScore}
                    <span className="text-base text-muted-foreground">/100</span>
                  </p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#047857] mt-1">
                    {scoreLabel(result.finalScore)}
                  </p>
                </div>
              </div>

              {/* Task */}
              <div className="border-t-2 border-border pt-5">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">
                  For completing
                </p>
                <p className="font-bold text-lg">{result.taskTitle}</p>
              </div>

              {/* Company + date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 border-2 border-border bg-muted p-3">
                  {result.logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={result.logoUrl}
                      alt={result.companyName}
                      className="w-10 h-10 object-contain bg-white border-2 border-border"
                    />
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center border-2 border-border bg-background">
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Company
                    </p>
                    <p className="font-bold">{result.companyName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 border-2 border-border bg-muted p-3">
                  <div className="w-10 h-10 flex items-center justify-center border-2 border-border bg-background">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                      Completed
                    </p>
                    <p className="font-bold">{formatDate(result.completedAt)}</p>
                  </div>
                </div>
              </div>

              {/* Certificate ID + profile link */}
              <div className="border-t-2 border-border pt-5 flex items-end justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-1">
                    Certificate ID
                  </p>
                  <p className="font-black tracking-widest break-all">
                    {result.certificateId}
                  </p>
                </div>
                {isAuthenticated && (
                  <Link
                    href={`/students/${result.studentId}`}
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-foreground text-background border-2 border-border font-black uppercase tracking-widest text-xs hover:translate-x-[2px] hover:translate-y-[2px] shadow-[4px_4px_0_0_var(--border)] hover:shadow-none transition-all"
                  >
                    View Profile
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
