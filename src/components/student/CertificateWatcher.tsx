"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useConvexTokenReady } from "@/lib/convexAuth";
import { awardCertificate } from "@/lib/xp";

/**
 * Watches the signed-in student's earned certificates (a reactive query) and
 * fires the certificate celebration whenever a new one appears — which happens
 * server-side when a task is completed and the certificate is minted.
 *
 * Records a baseline on first load so it doesn't celebrate pre-existing
 * certificates. Renders nothing. Mount once inside the student dashboard.
 */
export default function CertificateWatcher() {
  const tokenReady = useConvexTokenReady();
  const me = useQuery(api.users.currentUser, tokenReady ? {} : "skip");
  const studentId = me?.user?._id;

  const certificates = useQuery(
    api.certificates.getCertificatesByStudent,
    studentId ? { studentId } : "skip",
  );

  // null until the first snapshot; prevents celebrating existing certificates.
  const seenRef = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!certificates) return;

    const next = new Set(certificates.map((c) => c.certificateId));
    const seen = seenRef.current;
    seenRef.current = next;

    if (!seen) return; // first load — record the baseline only

    for (const cert of certificates) {
      if (!seen.has(cert.certificateId)) {
        awardCertificate({
          title: cert.taskTitle,
          certificateId: cert.certificateId,
        });
      }
    }
  }, [certificates]);

  return null;
}
