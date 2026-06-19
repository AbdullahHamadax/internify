"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Award, Download, Loader2, X } from "lucide-react";
import { Typography } from "@/components/ui/Typography";
import {
  getCertificatePdfBytes,
  generateCertificatePDF,
  type CertificateData,
} from "./CertificateTemplate";

interface CertificatePreviewModalProps {
  open: boolean;
  certificateData: CertificateData;
  onClose: () => void;
}

/**
 * Renders the generated certificate as an image so the student can confirm it
 * looks right BEFORE downloading. Viewing never triggers a download.
 *
 * We render via pdf.js → canvas → PNG rather than embedding the PDF in an
 * <iframe>: a blob/data PDF in an iframe is *downloaded* by many browsers
 * instead of shown inline, which is exactly the bug this avoids.
 */
export default function CertificatePreviewModal({
  open,
  certificateData,
  onClose,
}: CertificatePreviewModalProps) {
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [building, setBuilding] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(false);

  // Keep the latest data in a ref so the render effect can read it without
  // depending on the (unstable, rebuilt-every-render) object identity.
  const dataRef = useRef(certificateData);
  dataRef.current = certificateData;

  // Stable key over the meaningful fields — re-render with a new object that has
  // the same values must NOT re-trigger the build (that caused repeat downloads).
  const certKey = [
    certificateData.certificateId,
    certificateData.studentName,
    certificateData.taskTitle,
    certificateData.employerName,
    certificateData.finalScore,
    certificateData.completedAt,
    certificateData.employerLogoUrl ?? "",
  ].join("|");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setBuilding(true);
    setError(false);
    setPreviewSrc(null);

    void (async () => {
      try {
        const bytes = await getCertificatePdfBytes(dataRef.current);
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(bytes) })
          .promise;
        const page = await pdf.getPage(1);
        const outputScale =
          typeof window !== "undefined"
            ? Math.max(window.devicePixelRatio || 1, 1)
            : 1;
        const targetWidth = 1100;
        const baseViewport = page.getViewport({ scale: 1 });
        const cssScale = targetWidth / baseViewport.width;
        const viewport = page.getViewport({ scale: cssScale * outputScale });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas unavailable");
        canvas.width = Math.ceil(viewport.width);
        canvas.height = Math.ceil(viewport.height);

        await page.render({ canvas, viewport }).promise;
        page.cleanup();
        if (cancelled) return;

        setPreviewSrc(canvas.toDataURL("image/png"));
      } catch (err) {
        console.error("Failed to build certificate preview:", err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setBuilding(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // certKey captures all data fields; dataRef supplies the current object.
  }, [open, certKey]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await generateCertificatePDF(dataRef.current);
    } catch (err) {
      console.error("Failed to download certificate:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-4xl max-h-[92vh] bg-background border-4 border-border shadow-[8px_8px_0_0_var(--border)] flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 pb-3 border-b-4 border-border">
              <Typography
                variant="h3"
                className="font-black uppercase text-foreground tracking-widest flex items-center gap-2"
              >
                <Award className="w-5 h-5 text-[#AB47BC]" />
                Certificate Preview
              </Typography>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center border-2 border-border bg-transparent text-foreground shadow-[2px_2px_0_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                aria-label="Close preview"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Preview area */}
            <div className="flex-1 overflow-auto bg-muted p-4 sm:p-6 min-h-[300px] flex items-center justify-center">
              {building && (
                <div className="flex flex-col items-center gap-3 text-muted-foreground">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-sm font-bold uppercase tracking-widest">
                    Building certificate…
                  </span>
                </div>
              )}
              {error && (
                <div className="text-center text-red-500 font-bold">
                  Couldn&apos;t build the preview. Try downloading instead.
                </div>
              )}
              {!building && !error && previewSrc && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewSrc}
                  alt="Certificate preview"
                  className="w-full h-auto border-2 border-border shadow-[4px_4px_0_0_var(--border)] bg-white"
                />
              )}
            </div>

            {/* Footer actions */}
            <div className="p-4 sm:p-6 pt-4 border-t-4 border-border flex justify-end gap-3 bg-card">
              <button
                onClick={onClose}
                className="px-5 py-2.5 bg-transparent text-foreground border-2 border-border font-black uppercase tracking-widest text-xs hover:bg-muted transition-colors shadow-[2px_2px_0_0_var(--border)]"
              >
                Close
              </button>
              <button
                onClick={handleDownload}
                disabled={downloading || building}
                className="flex items-center gap-2 px-5 py-2.5 bg-[#AB47BC] text-white border-2 border-border font-black uppercase tracking-widest text-xs hover:translate-x-[2px] hover:translate-y-[2px] shadow-[4px_4px_0_0_var(--border)] hover:shadow-none transition-all disabled:opacity-50"
              >
                {downloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                {downloading ? "Downloading…" : "Download PDF"}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
