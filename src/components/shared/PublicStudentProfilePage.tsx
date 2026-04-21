"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthLoading, Authenticated, Unauthenticated, useMutation, useQuery } from "convex/react";
import {
  ArrowLeft,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
  FileCheck,
  FileText,
  Github,
  GraduationCap,
  Link as LinkIcon,
  Linkedin,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Send,
  Star,
  Trophy,
  X,
  Zap,
} from "lucide-react";
import deviconData from "devicon/devicon.json";
import { useRouter } from "next/navigation";

import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Typography } from "@/components/ui/Typography";
import { useConvexTokenReady } from "@/lib/convexAuth";
import {
  formatExternalLinkLabel,
  getGithubProfileLink,
  getLinkedinProfileLink,
  normalizeExternalLink,
} from "@/lib/profileLinks";

const ICON_MAPPINGS: Record<string, string> = {
  Vue: "vuejs",
  HTML: "html5",
  CSS: "css3",
  Express: "express",
  TensorFlow: "tensorFlow",
};

function getDeviconClass(skillName: string) {
  if (ICON_MAPPINGS[skillName]) {
    return `devicon-${ICON_MAPPINGS[skillName]}-plain colored`;
  }

  const match = (
    deviconData as Array<{ name: string; altnames: string[] }>
  ).find(
    (icon) =>
      icon.name === skillName.toLowerCase() ||
      icon.altnames.includes(skillName.toLowerCase()),
  );

  return match ? `devicon-${match.name}-plain colored` : null;
}

type RenderedPdfPage = {
  src: string;
  width: number;
  height: number;
};

function UploadedCvPdfRenderer({
  pdfData,
  mode,
}: {
  pdfData: Uint8Array | null;
  mode: "thumbnail" | "document";
}) {
  const [pages, setPages] = useState<RenderedPdfPage[]>([]);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  useEffect(() => {
    if (!pdfData) {
      setPages([]);
      setIsRendering(false);
      setRenderError(null);
      return;
    }

    let cancelled = false;

    setPages([]);
    setIsRendering(true);
    setRenderError(null);

    void (async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const loadingTask = pdfjsLib.getDocument({ data: pdfData.slice(0) });
        const pdf = await loadingTask.promise;
        const outputScale =
          typeof window !== "undefined" ? Math.max(window.devicePixelRatio || 1, 1) : 1;
        const targetWidth = mode === "thumbnail" ? 360 : 900;
        const pageCount = mode === "thumbnail" ? 1 : pdf.numPages;
        const renderedPages: RenderedPdfPage[] = [];

        for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const baseViewport = page.getViewport({ scale: 1 });
          const cssScale = targetWidth / baseViewport.width;
          const renderViewport = page.getViewport({ scale: cssScale * outputScale });
          const canvas = document.createElement("canvas");
          const context = canvas.getContext("2d");

          if (!context) {
            throw new Error("Canvas rendering is unavailable.");
          }

          canvas.width = Math.ceil(renderViewport.width);
          canvas.height = Math.ceil(renderViewport.height);

          await page.render({ canvas, viewport: renderViewport }).promise;
          page.cleanup();

          if (cancelled) {
            return;
          }

          renderedPages.push({
            src: canvas.toDataURL("image/png"),
            width: Math.max(Math.round(renderViewport.width / outputScale), 1),
            height: Math.max(Math.round(renderViewport.height / outputScale), 1),
          });
        }

        if (!cancelled) {
          setPages(renderedPages);
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        console.error("PDF render failed:", error);
        setRenderError("We couldn't render this PDF preview in the browser.");
      } finally {
        if (!cancelled) {
          setIsRendering(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mode, pdfData]);

  if (isRendering) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-4 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#0EA5E9]" />
        <Typography
          variant="span"
          className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground"
        >
          Preparing preview...
        </Typography>
      </div>
    );
  }

  if (renderError || pages.length === 0) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 px-4 text-center">
        <FileText className="h-10 w-10 text-[#0EA5E9]" />
        <Typography
          variant={mode === "thumbnail" ? "span" : "p"}
          className="max-w-[28rem] text-sm font-bold text-muted-foreground"
        >
          {renderError ?? "Preview unavailable right now. Open the file or download it below."}
        </Typography>
      </div>
    );
  }

  if (mode === "thumbnail") {
    const firstPage = pages[0];

    return (
      <Image
        src={firstPage.src}
        alt="CV thumbnail preview"
        width={firstPage.width}
        height={firstPage.height}
        unoptimized
        className="h-full w-full object-cover object-top"
        sizes="(max-width: 768px) 100vw, 420px"
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {pages.map((page, index) => (
        <div
          key={`${page.src}-${index}`}
          className="overflow-hidden border-4 border-border bg-white shadow-[4px_4px_0_0_var(--border)]"
        >
          <Image
            src={page.src}
            alt={`CV page ${index + 1}`}
            width={page.width}
            height={page.height}
            unoptimized
            className="h-auto w-full"
            sizes="(max-width: 1024px) 100vw, 900px"
          />
        </div>
      ))}
    </div>
  );
}

function FullScreenSpinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
    </div>
  );
}

function LoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return <FullScreenSpinner />;
}

function CompleteProfileRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/complete-profile");
  }, [router]);

  return <FullScreenSpinner />;
}

function PublicStudentProfileContent({ userId }: { userId: string }) {
  const isConvexTokenReady = useConvexTokenReady();
  const router = useRouter();
  const currentUser = useQuery(
    api.users.currentUser,
    isConvexTokenReady ? {} : "skip",
  );
  const profile = useQuery(
    api.users.getPublicStudentProfileDetail,
    isConvexTokenReady ? { userId: userId as Id<"users"> } : "skip",
  );
  const globalPresence = useQuery(
    api.presence.listRoom,
    isConvexTokenReady ? { roomId: "global:online" } : "skip",
  );
  const getOrCreateConversation = useMutation(
    api.messages.getOrCreateConversation,
  );
  const [isCvViewerOpen, setIsCvViewerOpen] = useState(false);
  const [uploadedCvPdfData, setUploadedCvPdfData] = useState<Uint8Array | null>(null);
  const [isUploadedCvPreviewLoading, setIsUploadedCvPreviewLoading] = useState(false);
  const [uploadedCvPreviewError, setUploadedCvPreviewError] = useState<string | null>(null);
  const [isStartingConversation, setIsStartingConversation] = useState(false);
  const cvPreviewUrl = profile?.cv?.url ?? null;
  const canPreviewUploadedCv =
    profile?.cv?.fileName.toLowerCase().endsWith(".pdf") ?? false;

  useEffect(() => {
    if (!canPreviewUploadedCv || !cvPreviewUrl) {
      setIsUploadedCvPreviewLoading(false);
      setUploadedCvPreviewError(null);
      setUploadedCvPdfData(null);
      return;
    }

    const controller = new AbortController();

    setIsUploadedCvPreviewLoading(true);
    setUploadedCvPreviewError(null);

    void (async () => {
      try {
        const response = await fetch(cvPreviewUrl, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`Failed to load CV preview (${response.status})`);
        }

        const pdfArrayBuffer = await response.arrayBuffer();

        if (controller.signal.aborted) {
          return;
        }

        setUploadedCvPdfData(new Uint8Array(pdfArrayBuffer));
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        console.error("CV preview load failed:", error);
        setUploadedCvPdfData(null);
        setUploadedCvPreviewError(
          "Preview unavailable in this browser. You can still download the file.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setIsUploadedCvPreviewLoading(false);
        }
      }
    })();

    return () => {
      controller.abort();
    };
  }, [canPreviewUploadedCv, cvPreviewUrl]);

  if (!isConvexTokenReady || currentUser === undefined || profile === undefined) {
    return <FullScreenSpinner />;
  }

  if (currentUser === null) {
    return <CompleteProfileRedirect />;
  }

  if (profile === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-xl border-4 border-black bg-card p-8 text-center shadow-[8px_8px_0_0_#000] dark:border-white dark:shadow-[8px_8px_0_0_#fff]">
          <Typography variant="h2" className="mb-3 uppercase">
            Student profile not found
          </Typography>
          <Typography variant="p" color="muted" className="mb-6">
            This student may have been removed or the profile link is invalid.
          </Typography>
          <Link
            href={currentUser.user.role === "employer" ? "/dashboard?tab=talent-search" : "/dashboard"}
            className="inline-flex items-center gap-2 border-4 border-black bg-[#2563EB] px-5 py-3 text-sm font-black uppercase tracking-widest text-white shadow-[4px_4px_0_0_#000] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] dark:border-white dark:shadow-[4px_4px_0_0_#fff] dark:hover:shadow-[6px_6px_0_0_#fff]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const studentProfile = profile.studentProfile;
  const backHref =
    currentUser.user.role === "employer" ? "/dashboard?tab=talent-search" : "/dashboard";
  const portfolioUrl = normalizeExternalLink(studentProfile?.portfolio);
  const githubUrl = getGithubProfileLink(studentProfile?.github);
  const linkedinUrl = getLinkedinProfileLink(studentProfile?.linkedin);
  const displayLocation = studentProfile?.city
    ? `${studentProfile.city}, Egypt`
    : studentProfile?.location;
  const memberSince = new Date(profile.memberSince).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const hasContactLinks = Boolean(portfolioUrl || githubUrl || linkedinUrl);
  const isStudentActive =
    globalPresence?.some((u) => u.userId === profile.userId) ?? false;
  const statusLabel = isStudentActive ? "Active / Available" : "Inactive / Not available";
  const statusClassName = isStudentActive
    ? "bg-[#DCFCE7] text-[#166534]"
    : "bg-[#E5E7EB] text-[#374151]";
  const showEmployerActions = currentUser.user.role === "employer";

  const handleMessageStudent = async () => {
    if (!showEmployerActions || isStartingConversation) return;

    setIsStartingConversation(true);
    try {
      const conversationId = await getOrCreateConversation({
        otherUserId: profile.userId as Id<"users">,
      });
      router.push(`/dashboard?tab=messages&conversationId=${conversationId}`);
    } catch (error) {
      console.error("Failed to open conversation:", error);
    } finally {
      setIsStartingConversation(false);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-[linear-gradient(180deg,#eef6ff_0%,#ffffff_45%,#f7fbff_100%)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href={backHref}
              className="inline-flex items-center gap-2 border-4 border-black bg-card px-4 py-2 text-xs font-black uppercase tracking-widest text-foreground shadow-[4px_4px_0_0_#000] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] dark:border-white dark:shadow-[4px_4px_0_0_#fff] dark:hover:shadow-[6px_6px_0_0_#fff]"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 border-4 border-black bg-[#FDE68A] px-4 py-2 text-xs font-black uppercase tracking-widest text-black shadow-[4px_4px_0_0_#000] dark:border-white dark:shadow-[4px_4px_0_0_#fff]">
                Read-only employer view
              </span>
              {showEmployerActions && (
                <button
                  type="button"
                  onClick={handleMessageStudent}
                  disabled={isStartingConversation}
                  className="inline-flex items-center gap-2 border-4 border-black bg-[#AB47BC] px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-[4px_4px_0_0_#000] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] disabled:translate-x-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70 dark:border-white dark:shadow-[4px_4px_0_0_#fff] dark:hover:shadow-[6px_6px_0_0_#fff]"
                >
                  {isStartingConversation ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Message
                </button>
              )}
            </div>
          </div>

        <section className="border-4 border-black bg-card p-6 shadow-[8px_8px_0_0_#000] dark:border-white dark:shadow-[8px_8px_0_0_#fff] sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-start">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center border-4 border-black bg-[#2563EB] text-3xl font-black uppercase text-white shadow-[4px_4px_0_0_#000] dark:border-white dark:shadow-[4px_4px_0_0_#fff]">
                {profile.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <Typography
                  variant="h1"
                  className="break-words text-3xl font-black uppercase tracking-tight sm:text-4xl"
                >
                  {profile.name}
                </Typography>
                {studentProfile?.title && (
                  <Typography
                    variant="h4"
                    color="muted"
                    className="mt-2 flex items-center gap-2"
                  >
                    <Briefcase className="h-4 w-4" />
                    {studentProfile.title}
                  </Typography>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
                  <span className="inline-flex items-center gap-1.5 font-black text-foreground">
                    <Star className="h-4 w-4 fill-[#F59E0B] text-[#F59E0B]" />
                    {profile.rating.toFixed(1)}
                  </span>
                  <span className="text-muted-foreground">
                    {profile.completedTasks} completed tasks
                  </span>
                  <span className="hidden h-2 w-2 rotate-45 bg-black sm:inline-block dark:bg-white" />
                  <span className="text-muted-foreground">Member since {memberSince}</span>
                  <span
                    className={`inline-flex items-center gap-2 border-2 border-black px-3 py-1 font-black uppercase tracking-widest shadow-[2px_2px_0_0_#000] dark:border-white dark:shadow-[2px_2px_0_0_#fff] ${statusClassName}`}
                  >
                    <span
                      className={`h-2.5 w-2.5 border border-black dark:border-white ${
                        isStudentActive ? "bg-green-500" : "bg-gray-500"
                      }`}
                    />
                    {statusLabel}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {studentProfile?.academicStatus && studentProfile?.fieldOfStudy && (
                    <span className="inline-flex items-center gap-2 border-2 border-border bg-muted px-3 py-1.5 font-bold">
                      <GraduationCap className="h-4 w-4" />
                      {studentProfile.academicStatus.charAt(0).toUpperCase() +
                        studentProfile.academicStatus.slice(1)}{" "}
                      in {studentProfile.fieldOfStudy}
                    </span>
                  )}
                  {displayLocation && (
                    <span className="inline-flex items-center gap-2 border-2 border-border bg-muted px-3 py-1.5 font-bold">
                      <MapPin className="h-4 w-4" />
                      {displayLocation}
                    </span>
                  )}
                  {studentProfile?.university && (
                    <span className="inline-flex items-center gap-2 border-2 border-border bg-muted px-3 py-1.5 font-bold">
                      <Building2 className="h-4 w-4" />
                      {studentProfile.university}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid min-w-[220px] gap-3 text-sm">
              <div className="border-4 border-black bg-[#EFF6FF] p-4 shadow-[4px_4px_0_0_#000] dark:border-white dark:shadow-[4px_4px_0_0_#fff]">
                <Typography variant="span" className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  Focus
                </Typography>
                <Typography variant="p" className="mt-1 text-sm font-black uppercase">
                  {studentProfile?.fieldOfStudy ?? "Student profile"}
                </Typography>
              </div>
              {studentProfile?.graduationYear && (
                <div className="border-4 border-black bg-[#F5F3FF] p-4 shadow-[4px_4px_0_0_#000] dark:border-white dark:shadow-[4px_4px_0_0_#fff]">
                  <Typography variant="span" className="block text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Graduation
                  </Typography>
                  <Typography variant="p" className="mt-1 text-sm font-black uppercase">
                    {studentProfile.graduationYear}
                  </Typography>
                </div>
              )}
            </div>
          </div>

          {studentProfile?.description && (
            <div className="mt-6 border-4 border-border bg-card p-5 shadow-[4px_4px_0_0_var(--border)]">
              <Typography variant="p" className="leading-relaxed text-foreground">
                {studentProfile.description}
              </Typography>
            </div>
          )}
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <section className="space-y-6">
            <div className="border-4 border-black bg-card p-6 shadow-[8px_8px_0_0_#000] dark:border-white dark:shadow-[8px_8px_0_0_#fff]">
              <Typography variant="h3" className="mb-4 flex items-center gap-3 uppercase">
                <span className="border-2 border-black bg-[#A7F3D0] p-1 text-black shadow-[2px_2px_0_0_#000] dark:border-white dark:shadow-[2px_2px_0_0_#fff]">
                  <Trophy className="h-5 w-5" />
                </span>
                Completed Work
              </Typography>

              <div className="space-y-4">
                {profile.completedWork.length === 0 ? (
                  <div className="border-4 border-dashed border-black bg-muted p-8 text-center text-muted-foreground dark:border-white">
                    <Typography variant="h4" className="mb-2 uppercase">
                      No completed work yet
                    </Typography>
                    <Typography variant="p" className="text-sm">
                      This student hasn&apos;t completed any published work on Internify yet.
                    </Typography>
                  </div>
                ) : (
                  profile.completedWork.map((item) => (
                    <article
                      key={item.applicationId}
                      className="border-4 border-border bg-card p-5 shadow-[4px_4px_0_0_var(--border)]"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1 border-2 border-border bg-[#047857] px-2 py-1 text-[10px] font-black uppercase tracking-widest text-white">
                              <CheckCircle2 className="h-3 w-3" />
                              Completed
                            </span>
                            <span className="border-2 border-border bg-muted px-2 py-1 text-[10px] font-black uppercase tracking-widest text-foreground">
                              {item.category}
                            </span>
                            <span className="border-2 border-border bg-muted px-2 py-1 text-[10px] font-black uppercase tracking-widest text-foreground">
                              {item.skillLevel}
                            </span>
                          </div>
                          <Typography variant="h4" className="break-words">
                            {item.title}
                          </Typography>
                        </div>
                        <div className="shrink-0 text-right text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          <div className="inline-flex items-center gap-1">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {new Date(item.recordedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-2 border border-border bg-muted px-2 py-1 font-bold text-foreground">
                          <Building2 className="h-4 w-4" />
                          {item.companyName}
                        </span>
                      </div>

                      <Typography variant="p" className="mt-4 text-sm leading-relaxed text-foreground">
                        {item.description}
                      </Typography>

                      {item.skills.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {item.skills.map((skill) => {
                            const devicon = getDeviconClass(skill);

                            return (
                              <span
                                key={`${item.applicationId}-${skill}`}
                                className="inline-flex items-center gap-1.5 border-2 border-black bg-[#2563EB] px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-[2px_2px_0_0_#000] dark:border-white dark:shadow-[2px_2px_0_0_#fff]"
                              >
                                {devicon && <i className={`${devicon} text-xs`} />}
                                {skill}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </article>
                  ))
                )}
              </div>
            </div>
          </section>

          <aside className="space-y-6">
            {profile.cv && (
              <section className="border-4 border-black bg-card p-6 shadow-[8px_8px_0_0_#000] dark:border-white dark:shadow-[8px_8px_0_0_#fff]">
                <Typography variant="h3" className="mb-4 flex items-center gap-3 uppercase">
                  <span className="border-2 border-black bg-[#DBEAFE] p-1 text-black shadow-[2px_2px_0_0_#000] dark:border-white dark:shadow-[2px_2px_0_0_#fff]">
                    <FileCheck className="h-5 w-5" />
                  </span>
                  CV
                </Typography>
                {canPreviewUploadedCv ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setIsCvViewerOpen(true)}
                      className="w-full group relative overflow-hidden border-4 border-black bg-gray-100 text-left shadow-[4px_4px_0_0_#000] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none dark:border-white dark:bg-gray-800 dark:shadow-[4px_4px_0_0_#fff]"
                    >
                      <div className="absolute left-0 top-0 z-10 h-16 w-16 rounded-br-[40px] bg-[#F43F5E]/80" />
                      <div className="absolute left-3 top-3 z-10">
                        <span className="border border-white/50 bg-black/50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-sm">
                          Featured
                        </span>
                      </div>

                      <div className="relative h-[200px] w-full overflow-hidden bg-white transition-transform duration-500 group-hover:scale-[1.02]">
                        <div className="absolute inset-0 z-10 bg-black/5 transition-colors group-hover:bg-transparent" />
                        {uploadedCvPdfData ? (
                          <div className="absolute inset-0">
                            <UploadedCvPdfRenderer
                              pdfData={uploadedCvPdfData}
                              mode="thumbnail"
                            />
                          </div>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 text-center">
                            {isUploadedCvPreviewLoading ? (
                              <>
                                <Loader2 className="h-8 w-8 animate-spin text-[#0EA5E9]" />
                                <Typography
                                  variant="span"
                                  className="text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground"
                                >
                                  Preparing preview...
                                </Typography>
                              </>
                            ) : (
                              <>
                                <FileText className="h-10 w-10 text-[#0EA5E9]" />
                                <Typography
                                  variant="span"
                                  className="max-w-[18rem] text-xs font-bold text-muted-foreground"
                                >
                                  {uploadedCvPreviewError ??
                                    "Preview unavailable right now. Open the file or download it below."}
                                </Typography>
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="relative z-10 border-t-4 border-black bg-black p-3 text-white">
                        <Typography variant="span" className="block truncate text-sm font-bold">
                          {profile.cv.fileName}
                        </Typography>
                        <Typography
                          variant="span"
                          className="mt-1 flex items-center gap-1 text-xs font-medium text-white/70"
                        >
                          <Eye className="h-3 w-3" />
                          {uploadedCvPreviewError
                            ? "Preview unavailable in Firefox? Use download below."
                            : isUploadedCvPreviewLoading
                              ? "Preparing preview..."
                              : "Click to view full screen"}
                        </Typography>
                      </div>
                    </button>

                    <div className="mt-3 flex gap-2">
                      {profile.cv.url && (
                        <a
                          href={profile.cv.url}
                          download={profile.cv.fileName}
                          className="flex flex-1 items-center justify-center gap-2 border-2 border-border bg-card py-2 text-[10px] font-black uppercase tracking-widest text-foreground shadow-[2px_2px_0_0_var(--border)] transition-all hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none"
                        >
                          <Download className="h-3 w-3" />
                          Download
                        </a>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="w-full overflow-hidden border-4 border-black bg-gray-100 text-left shadow-[4px_4px_0_0_#000] dark:border-white dark:bg-gray-800 dark:shadow-[4px_4px_0_0_#fff]">
                    <div className="flex h-[200px] flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_55%)] px-6 text-center">
                      <FileCheck className="h-12 w-12" />
                      <Typography variant="h4" className="uppercase">
                        CV Saved
                      </Typography>
                      <Typography variant="p" className="text-sm text-muted-foreground">
                        Preview isn&apos;t available for this file type, but the CV is ready to download.
                      </Typography>
                    </div>
                    <div className="border-t-4 border-black bg-black p-3 text-white">
                      <Typography variant="span" className="block truncate text-sm font-bold">
                        {profile.cv.fileName}
                      </Typography>
                    </div>
                    {profile.cv.url && (
                      <div className="p-3">
                        <a
                          href={profile.cv.url}
                          download={profile.cv.fileName}
                          className="inline-flex items-center gap-2 border-4 border-black bg-[#0EA5E9] px-4 py-2 text-xs font-black uppercase tracking-widest text-white shadow-[4px_4px_0_0_#000] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#000] dark:border-white dark:shadow-[4px_4px_0_0_#fff] dark:hover:shadow-[6px_6px_0_0_#fff]"
                        >
                          <Download className="h-4 w-4" />
                          Download CV
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )}

            {studentProfile?.skills && studentProfile.skills.length > 0 && (
              <section className="border-4 border-black bg-card p-6 shadow-[8px_8px_0_0_#000] dark:border-white dark:shadow-[8px_8px_0_0_#fff]">
                <Typography variant="h3" className="mb-4 flex items-center gap-3 uppercase">
                  <span className="border-2 border-black bg-[#FDE68A] p-1 text-black shadow-[2px_2px_0_0_#000] dark:border-white dark:shadow-[2px_2px_0_0_#fff]">
                    <Zap className="h-5 w-5" />
                  </span>
                  Skills
                </Typography>
                <div className="flex flex-wrap gap-2">
                  {studentProfile.skills.map((skill) => {
                    const devicon = getDeviconClass(skill);

                    return (
                      <span
                        key={skill}
                        className="inline-flex items-center gap-1.5 border-2 border-border bg-card px-3 py-1.5 text-[11px] font-black uppercase tracking-wider shadow-[2px_2px_0_0_var(--border)]"
                      >
                        {devicon && <i className={`${devicon} text-sm`} />}
                        {skill}
                      </span>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="border-4 border-black bg-card p-6 shadow-[8px_8px_0_0_#000] dark:border-white dark:shadow-[8px_8px_0_0_#fff]">
              <Typography variant="h3" className="mb-4 uppercase">
                Connect
              </Typography>
              <div className="space-y-3">
                <a
                  href={`mailto:${profile.email}`}
                  className="flex items-center gap-3 border-2 border-transparent p-2 transition-colors hover:border-border hover:bg-muted"
                >
                  <span className="border-2 border-border bg-[#FDE68A] p-1.5 text-black shadow-[2px_2px_0_0_var(--border)]">
                    <Mail className="h-4 w-4" />
                  </span>
                  <span className="truncate text-sm font-bold">{profile.email}</span>
                </a>

                {studentProfile?.phone && (
                  <div className="flex items-center gap-3 p-2">
                    <span className="border-2 border-border bg-[#DCFCE7] p-1.5 text-black shadow-[2px_2px_0_0_var(--border)]">
                      <Phone className="h-4 w-4" />
                    </span>
                    <span className="truncate text-sm font-bold">{studentProfile.phone}</span>
                  </div>
                )}

                {portfolioUrl && (
                  <a
                    href={portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 border-2 border-transparent p-2 transition-colors hover:border-border hover:bg-muted"
                  >
                    <span className="border-2 border-border bg-[#E9D5FF] p-1.5 text-black shadow-[2px_2px_0_0_var(--border)]">
                      <LinkIcon className="h-4 w-4" />
                    </span>
                    <span className="truncate text-sm font-bold">
                      {formatExternalLinkLabel(portfolioUrl)}
                    </span>
                  </a>
                )}

                {githubUrl && (
                  <a
                    href={githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 border-2 border-transparent p-2 transition-colors hover:border-border hover:bg-muted"
                  >
                    <span className="border-2 border-border bg-black p-1.5 text-white shadow-[2px_2px_0_0_var(--border)] dark:bg-white dark:text-black">
                      <Github className="h-4 w-4" />
                    </span>
                    <span className="truncate text-sm font-bold">
                      {formatExternalLinkLabel(githubUrl)}
                    </span>
                  </a>
                )}

                {linkedinUrl && (
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 border-2 border-transparent p-2 transition-colors hover:border-border hover:bg-muted"
                  >
                    <span className="border-2 border-border bg-[#0A66C2] p-1.5 text-white shadow-[2px_2px_0_0_var(--border)]">
                      <Linkedin className="h-4 w-4" />
                    </span>
                    <span className="truncate text-sm font-bold">
                      {formatExternalLinkLabel(linkedinUrl)}
                    </span>
                  </a>
                )}

                {!studentProfile?.phone && !hasContactLinks && (
                  <Typography variant="p" color="muted" className="text-sm italic">
                    No additional public contact links are listed.
                  </Typography>
                )}
              </div>
            </section>
          </aside>
        </div>
        </div>
      </div>
      {isCvViewerOpen && profile.cv && canPreviewUploadedCv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <div
            onClick={() => setIsCvViewerOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <div className="relative flex max-h-[90vh] min-h-0 w-full max-w-4xl flex-col overflow-hidden border-4 border-black bg-background shadow-[8px_8px_0_0_#000] dark:border-white dark:shadow-[8px_8px_0_0_#fff]">
            <div className="flex items-center justify-between border-b-4 border-border p-5 pb-3">
              <Typography
                variant="h3"
                className="flex items-center gap-2 font-black uppercase tracking-widest text-foreground"
              >
                <FileCheck className="h-5 w-5" />
                {profile.cv.fileName}
              </Typography>
              <button
                type="button"
                onClick={() => setIsCvViewerOpen(false)}
                className="flex h-8 w-8 items-center justify-center border-2 border-border bg-transparent text-foreground shadow-[2px_2px_0_0_var(--border)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-4">
              {uploadedCvPdfData ? (
                <div className="min-h-full border-4 border-border bg-[#F8FAFC] p-3 shadow-[4px_4px_0_0_var(--border)]">
                  <UploadedCvPdfRenderer
                    pdfData={uploadedCvPdfData}
                    mode="document"
                  />
                </div>
              ) : (
                <div className="flex min-h-[500px] w-full flex-col items-center justify-center gap-4 border-4 border-border bg-white px-6 text-center shadow-[4px_4px_0_0_var(--border)]">
                  {isUploadedCvPreviewLoading ? (
                    <>
                      <Loader2 className="h-10 w-10 animate-spin text-[#0EA5E9]" />
                      <Typography
                        variant="h4"
                        className="font-black uppercase tracking-[0.2em]"
                      >
                        Preparing preview
                      </Typography>
                      <Typography variant="p" className="max-w-md text-sm text-muted-foreground">
                        Firefox is loading a browser-safe preview of this PDF.
                      </Typography>
                    </>
                  ) : (
                    <>
                      <FileText className="h-12 w-12 text-[#0EA5E9]" />
                      <Typography
                        variant="h4"
                        className="font-black uppercase tracking-[0.2em]"
                      >
                        Preview unavailable
                      </Typography>
                      <Typography variant="p" className="max-w-md text-sm text-muted-foreground">
                        {uploadedCvPreviewError ??
                          "We couldn't open an in-browser preview for this file, but the download is still available."}
                      </Typography>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t-4 border-black bg-[#0EA5E9] p-4 dark:border-white">
              <button
                type="button"
                onClick={() => setIsCvViewerOpen(false)}
                className="border-4 border-white bg-transparent px-5 py-2 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-white hover:text-[#0EA5E9]"
              >
                Close
              </button>
              {profile.cv.url && (
                <a
                  href={profile.cv.url}
                  download={profile.cv.fileName}
                  className="flex items-center gap-2 border-4 border-white bg-white px-6 py-2 text-xs font-black uppercase tracking-widest text-[#0EA5E9] shadow-[4px_4px_0_0_rgba(255,255,255,0.3)] transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                >
                  <Download className="h-4 w-4" />
                  Download
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function PublicStudentProfilePage({ userId }: { userId: string }) {
  return (
    <>
      <AuthLoading>
        <FullScreenSpinner />
      </AuthLoading>
      <Unauthenticated>
        <LoginRedirect />
      </Unauthenticated>
      <Authenticated>
        <PublicStudentProfileContent userId={userId} />
      </Authenticated>
    </>
  );
}
