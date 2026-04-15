"use client";

import { useState, useRef } from "react";
import {
  X,
  Upload,
  FileText,
  Trash2,
  Loader2,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Typography } from "@/components/ui/Typography";
import { useLiveNow } from "@/lib/useLiveNow";

interface SubmitTaskModalProps {
  open: boolean;
  applicationId: string;
  taskTitle: string;
  companyName: string;
  deadline: number;
  hasSubmission: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

interface PendingFile {
  file: File;
  id: string;
}

export default function SubmitTaskModal({
  open,
  applicationId,
  taskTitle,
  companyName,
  deadline,
  hasSubmission,
  onClose,
  onSubmitted,
}: SubmitTaskModalProps) {
  const now = useLiveNow();
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.tasks.generateUploadUrl);
  const submitTask = useMutation(api.tasks.submitTask);
  const isExpired = deadline <= now;

  if (!open) return null;

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles: PendingFile[] = Array.from(files).map((file) => ({
      file,
      id: `${file.name}-${Date.now()}-${Math.random()}`,
    }));
    setPendingFiles((prev) => [...prev, ...newFiles]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (id: string) => {
    setPendingFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSubmit = async () => {
    if (pendingFiles.length === 0) {
      setError("Please select at least one file to submit.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const uploadedFiles: { storageId: Id<"_storage">; name: string; type: string }[] = [];

      for (const pf of pendingFiles) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": pf.file.type || "application/octet-stream" },
          body: pf.file,
        });

        if (!result.ok) throw new Error(`Failed to upload ${pf.file.name}`);
        const { storageId } = await result.json();
        uploadedFiles.push({ storageId, name: pf.file.name, type: pf.file.type || "application/octet-stream" });
      }

      await submitTask({
        applicationId: applicationId as Id<"applications">,
        files: uploadedFiles,
        note: note.trim() || undefined,
      });

      setPendingFiles([]);
      setNote("");
      onSubmitted();
      onClose();
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-card border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff] max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b-4 border-black dark:border-white">
          <div className="min-w-0 flex-1 pr-4">
            <Typography variant="h3" className="uppercase font-black tracking-tight truncate">
              {hasSubmission
                ? "Submission Complete"
                : isExpired
                  ? "Deadline Passed"
                  : "Submit Work"}
            </Typography>
            <Typography variant="span" color="muted" className="text-sm truncate block mt-1">
              {taskTitle} • {companyName}
            </Typography>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 border-2 border-black dark:border-white bg-white dark:bg-black shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {hasSubmission ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 border-4 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400" />
              </div>
              <Typography variant="h4" className="text-center font-black uppercase">
                Already Submitted
              </Typography>
              <Typography variant="p" color="muted" className="text-center text-sm max-w-xs">
                You have already submitted your work for this task. The employer will review it soon.
              </Typography>
            </div>
          ) : isExpired ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="p-4 bg-red-100 dark:bg-red-900/30 border-4 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]">
                <Clock className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
              <Typography variant="h4" className="text-center font-black uppercase">
                Submission Closed
              </Typography>
              <Typography variant="p" color="muted" className="text-center text-sm max-w-xs">
                This task deadline has passed, so new submissions are no longer accepted. It will be removed automatically after the grace period.
              </Typography>
            </div>
          ) : (
            <>
              {/* Drop zone */}
              <div
                className="border-4 border-dashed border-black dark:border-white p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all hover:bg-muted/50"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="p-3 bg-[#2563EB] border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]">
                  <Upload className="w-6 h-6 text-white" />
                </div>
                <div className="text-center">
                  <Typography variant="h4" className="font-black uppercase text-sm">
                    Click to upload files
                  </Typography>
                  <Typography variant="span" color="muted" className="text-xs">
                    Upload your project files (any file type accepted)
                  </Typography>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFilesSelected}
                />
              </div>

              {/* File list */}
              {pendingFiles.length > 0 && (
                <div className="space-y-2">
                  <Typography variant="h4" className="font-black uppercase text-xs tracking-widest">
                    Files ({pendingFiles.length})
                  </Typography>
                  {pendingFiles.map((pf) => (
                    <div
                      key={pf.id}
                      className="flex items-center gap-3 p-3 bg-muted/50 border-2 border-black dark:border-white"
                    >
                      <FileText className="w-4 h-4 text-[#2563EB] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-bold truncate block">{pf.file.name}</span>
                        <span className="text-xs text-muted-foreground">{formatSize(pf.file.size)}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(pf.id)}
                        className="p-1.5 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 border-2 border-transparent hover:border-red-600 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Note */}
              <div>
                <Typography variant="h4" className="font-black uppercase text-xs tracking-widest mb-2">
                  Note (optional)
                </Typography>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Add any notes about your submission..."
                  className="w-full min-h-[80px] p-3 bg-card border-2 border-black dark:border-white text-sm resize-none focus:outline-none focus:shadow-[4px_4px_0_0_#2563EB]"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-100 dark:bg-red-900/30 border-2 border-red-600 text-red-700 dark:text-red-400 text-sm font-bold">
                  {error}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!hasSubmission && !isExpired && (
          <div className="p-5 border-t-4 border-black dark:border-white flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border-2 border-black dark:border-white font-black uppercase text-xs tracking-widest shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all bg-card"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={uploading || pendingFiles.length === 0}
              className="px-5 py-2.5 border-2 border-black dark:border-white font-black uppercase text-xs tracking-widest shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] dark:hover:shadow-[2px_2px_0_0_#fff] transition-all bg-[#2563EB] text-white disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Submit
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
