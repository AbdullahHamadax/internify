"use client";

import { useUser } from "@clerk/nextjs";
import { Typography } from "@/components/ui/Typography";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Briefcase,
  MapPin,
  Mail,
  Link as LinkIcon,
  Github,
  Linkedin,
  Edit,
  Download,
  Share2,
  CheckCircle2,
  Loader2,
  Star,
  Check,
  Zap,
  Trophy,
  X,
  FileText,
  Eye,
  ChevronLeft,
  ScanLine,
  Upload,
  AlertTriangle,
  TrendingUp,
  Target,
  Phone,
  Save,
  Trash2,
  FileCheck,
} from "lucide-react";
import { EGYPTIAN_UNIVERSITIES, EGYPTIAN_CITIES } from "@/lib/egyptianData";
import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import deviconData from "devicon/devicon.json";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { SKILL_CATALOG } from "@/lib/skillCatalog";
import { generateCvPdf } from "@/lib/cvPdfGenerator";
import { extractTextFromPdf } from "@/lib/pdfTextExtractor";
import { getMissingRequiredCvProfileFields } from "@/lib/studentCvOnboarding";

// ── Skill XP Helpers ──
type SkillLevel = "Beginner" | "Intermediate" | "Advanced";

function getSkillLevel(xp: number): SkillLevel {
  if (xp >= 1500) return "Advanced";
  if (xp >= 1000) return "Intermediate";
  return "Beginner";
}

function getSkillLevelStyle(level: SkillLevel) {
  switch (level) {
    case "Advanced":
      return "bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-700";
    case "Intermediate":
      return "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950 dark:text-blue-400 dark:border-blue-700";
    default:
      return "bg-gray-100 text-gray-600 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600";
  }
}

function getSkillProgress(xp: number) {
  if (xp >= 1500) {
    // Advanced tier — progress toward 2000 max
    return {
      percentage: Math.min(((xp - 1500) / 500) * 100, 100),
      xpToNext: Math.max(2000 - xp, 0),
      nextLevel: xp >= 2000 ? null : ("Max" as const),
      currentMin: 1500,
      currentMax: 2000,
    };
  }
  if (xp >= 1000) {
    // Intermediate tier — progress toward Advanced (1500)
    return {
      percentage: ((xp - 1000) / 500) * 100,
      xpToNext: 1500 - xp,
      nextLevel: "Advanced" as const,
      currentMin: 1000,
      currentMax: 1500,
    };
  }
  // Beginner tier — progress toward Intermediate (1000)
  return {
    percentage: (xp / 1000) * 100,
    xpToNext: 1000 - xp,
    nextLevel: "Intermediate" as const,
    currentMin: 0,
    currentMax: 1000,
  };
}

function getProgressBarColor(level: SkillLevel) {
  switch (level) {
    case "Advanced":
      return "bg-emerald-500";
    case "Intermediate":
      return "bg-blue-500";
    default:
      return "bg-gray-400";
  }
}

// ── Portal-based Skill XP Tooltip ──
function SkillXpTooltip({
  skill,
  xp,
  level,
  levelStyle,
  progress,
  progressBarColor,
  triggerRef,
  visible,
}: {
  skill: string;
  xp: number;
  level: SkillLevel;
  levelStyle: string;
  progress: ReturnType<typeof getSkillProgress>;
  progressBarColor: string;
  triggerRef: React.RefObject<HTMLDivElement | null>;
  visible: boolean;
}) {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!visible || !triggerRef.current) {
      setCoords(null);
      return;
    }

    const update = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      // Position below the badge, centered horizontally
      setCoords({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2,
      });
    };

    update();

    // Re-calculate on scroll/resize so the tooltip tracks the badge
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [visible, triggerRef]);

  if (!visible || !coords) return null;

  return createPortal(
    <div
      className="fixed z-[9999] w-56 -translate-x-1/2 animate-in fade-in zoom-in-95 duration-150"
      style={{ top: coords.top, left: coords.left }}
    >
      {/* Arrow pointing up */}
      <div className="flex justify-center -mb-[1px]">
        <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-border" />
      </div>
      <div className="relative flex justify-center -mb-[5px]" style={{ marginTop: -6 }}>
        <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-b-[6px] border-b-card" />
      </div>

      <div className="bg-card border-4 border-border shadow-[4px_4px_0_0_var(--border)] p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-widest font-black text-foreground">
            {skill}
          </span>
          <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 border ${levelStyle}`}>
            {level}
          </span>
        </div>

        <p className="text-sm font-bold text-foreground">
          {xp.toLocaleString()} XP
        </p>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-muted border border-border overflow-hidden">
          <div
            className={`h-full ${progressBarColor} transition-all duration-500`}
            style={{ width: `${progress.percentage}%` }}
          />
        </div>

        {/* XP to next level text */}
        <p className="text-[11px] text-muted-foreground">
          {xp >= 2000
            ? "Maximum XP reached!"
            : progress.nextLevel === "Max"
              ? `${progress.xpToNext.toLocaleString()} XP to max`
              : `${progress.xpToNext.toLocaleString()} XP to ${progress.nextLevel}`}
        </p>
      </div>
    </div>,
    document.body,
  );
}

// ── Skill Badge with Portal Tooltip ──
function SkillBadgeWithTooltip({
  skill,
  skillXpData,
}: {
  skill: string;
  skillXpData: Array<{ skill: string; xp: number }> | null | undefined;
}) {
  const badgeRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const devicon = getDeviconClass(skill);
  const xpEntry = skillXpData?.find((e) => e.skill === skill);
  const xp = xpEntry?.xp ?? 0;
  const level = getSkillLevel(xp);
  const levelStyle = getSkillLevelStyle(level);
  const progress = getSkillProgress(xp);
  const progressBarColor = getProgressBarColor(level);

  return (
    <div
      ref={badgeRef}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative flex flex-col items-start gap-1 py-2 px-4 bg-card border-4 border-black shadow-[4px_4px_0_0_#000] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#000] transition-all cursor-default"
    >
      <div className="flex items-center gap-2">
        {devicon && <i className={`${devicon} text-lg`} />}
        <span className="uppercase tracking-wide text-sm font-black text-foreground">
          {skill}
        </span>
      </div>
      {/* Level Badge */}
      <span
        className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 border ${levelStyle}`}
      >
        {level}
      </span>

      <SkillXpTooltip
        skill={skill}
        xp={xp}
        level={level}
        levelStyle={levelStyle}
        progress={progress}
        progressBarColor={progressBarColor}
        triggerRef={badgeRef}
        visible={hovered}
      />
    </div>
  );
}

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

// Default fallback for profile when fields aren't filled yet
const DEFAULT_PROFILE = {
  title: "Add your professional title",
  location: "Add your location",
  description:
    "Tell employers about your passion, goals, and what you're looking for...",
  email: "No email provided",
  portfolio: "",
  github: "",
  linkedin: "",
  skills: [] as string[],
  rating: 0,
  reviewsCount: 0,
};

// Motion Variants
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

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

export default function StudentProfile() {
  const { user } = useUser();
  const searchParams = useSearchParams();
  const applications = useQuery(api.tasks.getStudentApplications);
  const currentUserData = useQuery(api.users.currentUser);
  const globalPresence = useQuery(api.presence.listRoom, { roomId: "global:online" });
  const isOnline = globalPresence?.some(
    (u) => u.userId === currentUserData?.user?._id,
  );
  const upsertCurrentUser = useMutation(api.users.upsertCurrentUser);
  const skillXpData = useQuery(api.users.getStudentSkillXp);

  const studentProfile = currentUserData?.studentProfile;
  const dbUser = currentUserData?.user;

  // Profile Data Resolution
  const profileTitle = studentProfile?.title || DEFAULT_PROFILE.title;
  const profileLocation = studentProfile?.city
    ? `${studentProfile.city}, Egypt`
    : studentProfile?.location || DEFAULT_PROFILE.location;
  const profileDescription =
    studentProfile?.description || DEFAULT_PROFILE.description;
  const profileEmail = dbUser?.email || DEFAULT_PROFILE.email;
  const profilePortfolio =
    studentProfile?.portfolio || DEFAULT_PROFILE.portfolio;
  const profileGithub = studentProfile?.github || DEFAULT_PROFILE.github;
  const profileLinkedin = studentProfile?.linkedin || DEFAULT_PROFILE.linkedin;
  const profileSkills = studentProfile?.skills || DEFAULT_PROFILE.skills;

  // Derive rating from completed tasks (mocked rating logic for now)
  const completedCount =
    applications?.filter((app) => app.status === "completed").length || 0;
  const rating =
    completedCount > 0 ? 4.5 + Math.min(completedCount * 0.1, 0.5) : 0; // Fake climbing rating

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    location: "",
    description: "",
    portfolio: "",
    github: "",
    linkedin: "",
    skills: [] as string[],
    university: "",
    degree: "",
    graduationYear: "",
    gpa: "",
    phone: "",
    city: "",
  });
  const [skillInput, setSkillInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // CV Modal State
  const [isCvModalOpen, setIsCvModalOpen] = useState(false);
  const [cvStep, setCvStep] = useState<"select" | "preview">("select");
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(new Set());
  const [isGeneratingCv, setIsGeneratingCv] = useState(false);
  const [cvError, setCvError] = useState<string | null>(null);
  const [cvPdfBlobUrl, setCvPdfBlobUrl] = useState<string | null>(null);
  const [cvPdfFileName, setCvPdfFileName] = useState<string>("CV.pdf");
  const [cvBlockedFields, setCvBlockedFields] = useState<string[]>([]);

  // CV Analyzer State
  const [isAnalyzerOpen, setIsAnalyzerOpen] = useState(false);
  const [analyzerStep, setAnalyzerStep] = useState<"upload" | "results">("upload");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzerError, setAnalyzerError] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  // CV Upload & Management State
  const [isUploadingCv, setIsUploadingCv] = useState(false);
  const [isSavingGeneratedCv, setIsSavingGeneratedCv] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isCvViewerOpen, setIsCvViewerOpen] = useState(false);
  const [uploadedCvPdfData, setUploadedCvPdfData] = useState<Uint8Array | null>(null);
  const [isUploadedCvPreviewLoading, setIsUploadedCvPreviewLoading] = useState(false);
  const [uploadedCvPreviewError, setUploadedCvPreviewError] = useState<string | null>(null);
  const cvUploadInputRef = useRef<HTMLInputElement>(null);

  // CV Backend Hooks
  const cvData = useQuery(api.users.getCvDownloadUrl);
  const saveCvToProfile = useMutation(api.users.saveCvToProfile);
  const deleteCvFromProfile = useMutation(api.users.deleteCvFromProfile);
  const generateUploadUrl = useMutation(api.tasks.generateUploadUrl);
  const cvPrompt = searchParams.get("cvPrompt");
  const cvMissingFields = useMemo(
    () => getMissingRequiredCvProfileFields(studentProfile),
    [studentProfile],
  );
  const canPreviewUploadedCv =
    cvData?.fileName.toLowerCase().endsWith(".pdf") ?? false;

  useEffect(() => {
    if (!canPreviewUploadedCv || !cvData?.url) {
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
        const response = await fetch(cvData.url, {
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
  }, [canPreviewUploadedCv, cvData?.url]);

  // Sync state when modal opens
  useEffect(() => {
    if (isEditing && studentProfile) {
      setFormData({
        title: studentProfile.title || "",
        location: studentProfile.location || "",
        description: studentProfile.description || "",
        portfolio: studentProfile.portfolio || "",
        github: studentProfile.github || "",
        linkedin: studentProfile.linkedin || "",
        skills: studentProfile.skills || [],
        university: studentProfile.university || "",
        degree: studentProfile.degree || "",
        graduationYear: studentProfile.graduationYear ? String(studentProfile.graduationYear) : "",
        gpa: studentProfile.gpa != null ? String(studentProfile.gpa) : "",
        phone: studentProfile.phone || "",
        city: studentProfile.city || "",
      });
    }
  }, [isEditing, studentProfile]);

  useEffect(() => {
    if (cvPrompt !== "complete" || !studentProfile) {
      return;
    }

    if (cvMissingFields.length === 0) {
      return;
    }

    setCvBlockedFields(cvMissingFields);
    setIsEditing(true);
  }, [cvMissingFields, cvPrompt, studentProfile]);

  const handleSaveProfile = async () => {
    if (!studentProfile) return;
    setIsSaving(true);
    try {
      await upsertCurrentUser({
        role: "student",
        studentProfile: {
          academicStatus: studentProfile.academicStatus,
          fieldOfStudy: studentProfile.fieldOfStudy,
          title: formData.title,
          location: formData.location,
          description: formData.description,
          portfolio: formData.portfolio,
          github: formData.github,
          linkedin: formData.linkedin,
          skills: formData.skills,
          cvFileName: studentProfile.cvFileName,
          university: formData.university || undefined,
          degree: formData.degree || undefined,
          graduationYear: formData.graduationYear ? Number(formData.graduationYear) : undefined,
          gpa: formData.gpa ? Number(formData.gpa) : undefined,
          phone: formData.phone || undefined,
          city: formData.city || undefined,
        },
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save profile:", error);
      alert("Failed to save profile.");
    } finally {
      setIsSaving(false);
    }
  };

  // Skill Picker Logic
  const normalize = (s: string) => s.trim().toLowerCase();
  const trimmedSkillQuery = skillInput.trim();
  const queryNorm = normalize(trimmedSkillQuery);
  const filteredCatalog = trimmedSkillQuery
    ? SKILL_CATALOG.filter((skill) => normalize(skill).includes(queryNorm))
    : SKILL_CATALOG;
  const exactCatalogMatch = SKILL_CATALOG.some(
    (s) => normalize(s) === queryNorm,
  );
  const alreadySelected = formData.skills.some(
    (s) => normalize(s) === queryNorm,
  );
  const showCustomAdd =
    trimmedSkillQuery.length > 0 && !exactCatalogMatch && !alreadySelected;

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && skillInput.trim() !== "") {
      e.preventDefault();

      const customMatch = SKILL_CATALOG.find(
        (s) => normalize(s) === normalize(skillInput),
      );
      const skillToAdd =
        customMatch ||
        skillInput
          .trim()
          .replace(
            /\w\S*/g,
            (txt) =>
              txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase(),
          );

      if (!formData.skills.includes(skillToAdd)) {
        setFormData({ ...formData, skills: [...formData.skills, skillToAdd] });
      }
      setSkillInput("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skillToRemove),
    });
  };

  const completedTasks =
    applications?.filter((app) => app.status === "completed") || [];

  // Open the CV modal — hard-gate: all required fields must be filled
  const handleOpenCvModal = useCallback(() => {
    if (!studentProfile) return;

    // Check completeness of new required CV fields
    const missing = cvMissingFields;

    if (missing.length > 0) {
      // Signal the edit modal to open with the missing-fields banner
      setCvBlockedFields(missing);
      setIsEditing(true);
      return;
    }

    const completed = (applications ?? []).filter((app) => app.status === "completed");
    setSelectedTaskIds(new Set(completed.map((app) => app._id)));
    setCvStep("select");
    setCvError(null);
    setCvPdfBlobUrl(null);
    setIsCvModalOpen(true);
  }, [applications, cvMissingFields, studentProfile]);

  const handleCloseCvModal = useCallback(() => {
    setIsCvModalOpen(false);
    // Revoke blob URL to free memory
    if (cvPdfBlobUrl) {
      URL.revokeObjectURL(cvPdfBlobUrl);
      setCvPdfBlobUrl(null);
    }
  }, [cvPdfBlobUrl]);

  const toggleTaskSelection = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleGenerateCV = async () => {
    if (!user || !studentProfile || !dbUser) return;
    setIsGeneratingCv(true);
    setCvError(null);
    try {
      const completedTasksData = (applications ?? [])
        .filter((app) => app.status === "completed" && selectedTaskIds.has(app._id))
        .map((app) => ({
          title: app.task.title,
          companyName: app.task.companyName,
          category: app.task.category,
          skillLevel: app.task.skillLevel,
          skills: app.task.skills,
          completedDate: new Date(app.acceptedAt).toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          }),
        }));

      const response = await fetch("/api/generate-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: user.fullName ?? "Student",
          email: dbUser.email,
          title: studentProfile.title,
          description: studentProfile.description,
          academicStatus: studentProfile.academicStatus,
          fieldOfStudy: studentProfile.fieldOfStudy,
          skills: studentProfile.skills,
          portfolio: studentProfile.portfolio,
          github: studentProfile.github,
          linkedin: studentProfile.linkedin,
          completedTasks: completedTasksData,
          university: studentProfile.university,
          degree: studentProfile.degree,
          graduationYear: studentProfile.graduationYear,
          gpa: studentProfile.gpa,
          phone: studentProfile.phone,
          city: studentProfile.city,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to generate CV");
      }

      const { cv } = await response.json();

      const doc = generateCvPdf(cv, user.fullName ?? "Student", dbUser.email);
      const pdfBlob = doc.output("blob");
      const blobUrl = URL.createObjectURL(pdfBlob);
      const safeName = (user.fullName ?? "Student").replace(/\s+/g, "_");

      setCvPdfBlobUrl(blobUrl);
      setCvPdfFileName(`${safeName}_CV.pdf`);
      setCvStep("preview");
    } catch (err) {
      console.error("CV generation failed:", err);
      setCvError(err instanceof Error ? err.message : "Failed to generate CV");
    } finally {
      setIsGeneratingCv(false);
    }
  };

  const handleDownloadCv = () => {
    if (!cvPdfBlobUrl) return;
    const a = document.createElement("a");
    a.href = cvPdfBlobUrl;
    a.download = cvPdfFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ─── CV Analyzer ───
  const handleOpenAnalyzer = () => {
    setAnalyzerStep("upload");
    setAnalyzerError(null);
    setAnalysisResult(null);
    setUploadedFileName(null);
    setIsAnalyzerOpen(true);
  };

  const handleAnalyzeCv = async (file: File) => {
    if (!file || file.type !== "application/pdf") {
      setAnalyzerError("Please upload a PDF file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setAnalyzerError("File too large. Maximum 10MB.");
      return;
    }

    setUploadedFileName(file.name);
    setIsAnalyzing(true);
    setAnalyzerError(null);

    try {
      const cvText = await extractTextFromPdf(file);

      if (!cvText || cvText.trim().length < 50) {
        throw new Error(
          "Could not extract enough text. Please upload a text-based PDF, not a scanned image."
        );
      }

      const fieldOfStudy = studentProfile?.fieldOfStudy || "General";

      const response = await fetch("/api/analyze-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText, fieldOfStudy }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to analyze CV");
      }

      const { analysis } = await response.json();
      setAnalysisResult(analysis);
      setAnalyzerStep("results");
    } catch (err) {
      console.error("CV analysis failed:", err);
      setAnalyzerError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleAnalyzeCv(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleAnalyzeCv(file);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600";
    if (score >= 60) return "text-amber-500";
    return "text-red-500";
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return "bg-emerald-100 border-emerald-500";
    if (score >= 60) return "bg-amber-100 border-amber-500";
    return "bg-red-100 border-red-500";
  };

  const getPriorityColor = (priority: string) => {
    if (priority === "high") return "bg-red-500 text-white";
    if (priority === "medium") return "bg-amber-400 text-black";
    return "bg-emerald-400 text-black";
  };

  const [shared, setShared] = useState(false);

  const handleShare = async () => {
    const url =
      typeof window !== "undefined"
        ? window.location.href
        : "https://internify.com";
    const shareData = {
      title: `${user?.fullName ?? "Student"}'s Profile - Internify`,
      text: "Check out my portfolio and completed missions on Internify!",
      url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  // ─── CV Upload Handler ───
  const handleUploadCv = async (file: File) => {
    if (!file || file.type !== "application/pdf") {
      alert("Please upload a PDF file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("File too large. Maximum 10MB.");
      return;
    }
    setIsUploadingCv(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();
      await saveCvToProfile({ storageId, fileName: file.name });
    } catch (err) {
      console.error("CV upload failed:", err);
      alert("Failed to upload CV. Please try again.");
    } finally {
      setIsUploadingCv(false);
      if (cvUploadInputRef.current) cvUploadInputRef.current.value = "";
    }
  };

  // ─── Save Generated CV to Profile ───
  const handleSaveGeneratedCv = async () => {
    if (!cvPdfBlobUrl) return;
    setIsSavingGeneratedCv(true);
    try {
      const response = await fetch(cvPdfBlobUrl);
      const blob = await response.blob();
      const uploadUrl = await generateUploadUrl();
      const uploadResult = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "application/pdf" },
        body: blob,
      });
      const { storageId } = await uploadResult.json();
      await saveCvToProfile({ storageId, fileName: cvPdfFileName });
      setShowSaveConfirm(false);
    } catch (err) {
      console.error("Failed to save generated CV:", err);
      alert("Failed to save CV to profile. Please try again.");
    } finally {
      setIsSavingGeneratedCv(false);
    }
  };

  // ─── Analyze Current CV (already uploaded) ───
  const handleAnalyzeCurrentCv = async () => {
    if (!cvData?.url || !canPreviewUploadedCv) return;
    setIsAnalyzing(true);
    setAnalyzerError(null);
    setUploadedFileName(cvData.fileName);
    try {
      const response = await fetch(cvData.url);
      const blob = await response.blob();
      const file = new File([blob], cvData.fileName, { type: "application/pdf" });
      const cvText = await extractTextFromPdf(file);
      if (!cvText || cvText.trim().length < 50) {
        throw new Error("Could not extract enough text from CV.");
      }
      const fieldOfStudy = studentProfile?.fieldOfStudy || "General";
      const analysisResponse = await fetch("/api/analyze-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvText, fieldOfStudy }),
      });
      if (!analysisResponse.ok) {
        const err = await analysisResponse.json();
        throw new Error(err.error || "Failed to analyze CV");
      }
      const { analysis } = await analysisResponse.json();
      setAnalysisResult(analysis);
      setAnalyzerStep("results");
    } catch (err) {
      console.error("CV analysis failed:", err);
      setAnalyzerError(err instanceof Error ? err.message : "Analysis failed");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ─── Delete CV ───
  const handleDeleteCv = async () => {
    if (!confirm("Are you sure you want to remove your CV?")) return;
    try {
      await deleteCvFromProfile();
    } catch (err) {
      console.error("Failed to delete CV:", err);
      alert("Failed to remove CV.");
    }
  };

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="space-y-8 pb-10"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Identity & Actions (1/3 Width) */}
        <motion.div variants={itemVariants} className="lg:col-span-4 space-y-6">
          {/* Main Profile Card */}
          <div className="bg-card border-4 border-border shadow-[8px_8px_0_0_var(--border)] p-6 relative">
            <div className="absolute -top-4 -right-4 bg-[#2563EB] text-white border-4 border-black dark:border-white px-3 py-1 font-black text-xs uppercase tracking-widest shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] z-10 rotate-3 hover:rotate-6 transition-transform">
              Available
            </div>

            <div className="flex flex-col items-center text-center space-y-4 pt-4">
              {/* Brutalist Avatar */}
              <div className="relative shrink-0 w-32 h-32">
                <div className="w-full h-full border-4 border-border bg-[#AB47BC] shadow-[4px_4px_0_0_var(--border)] flex items-center justify-center overflow-hidden">
                  {user?.imageUrl ? (
                    <Image
                      src={user.imageUrl}
                      alt="Profile"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover mix-blend-hard-light"
                    />
                  ) : (
                    <span className="text-4xl font-black text-white">
                      {(user?.firstName?.charAt(0) ?? "S").toUpperCase()}
                    </span>
                  )}
                </div>
                <span 
                  className={`absolute -bottom-1 -right-1 size-6 ${isOnline ? "bg-green-500" : "bg-gray-400"} border-4 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] z-10`}
                  title={isOnline ? "Online" : "Offline"}
                />
              </div>

              <div className="min-w-0 w-full max-w-full px-1">
                <Typography
                  variant="h2"
                  className="mt-2 tracking-tighter break-words line-clamp-3"
                  title={user?.fullName ?? undefined}
                >
                  {user?.fullName ?? "Student Name"}
                </Typography>
                <Typography
                  variant="h4"
                  color="muted"
                  className="mt-1 flex items-center justify-center gap-2"
                >
                  <Briefcase className="w-4 h-4" />
                  {profileTitle}
                </Typography>

                {/* Rating Display */}
                {rating > 0 && (
                  <div className="flex items-center justify-center gap-1.5 mt-2">
                    <Star className="w-4 h-4 fill-[#F59E0B] text-[#F59E0B]" />
                    <Typography variant="span" className="font-black text-sm">
                      {rating.toFixed(1)}
                    </Typography>
                  </div>
                )}

                <Typography
                  variant="span"
                  color="muted"
                  className="flex items-center justify-center gap-2 mt-1"
                >
                  <MapPin className="w-4 h-4" />
                  {profileLocation}
                </Typography>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t-4 border-border">
              <Typography
                variant="p"
                className="text-sm font-medium leading-relaxed max-w-none"
              >
                {profileDescription}
              </Typography>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setIsEditing(true)}
              className="group w-full flex items-center justify-center gap-2 py-3 bg-[#2563EB] text-white border-4 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] font-black uppercase tracking-widest text-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:translate-x-[4px] active:translate-y-[4px]"
            >
              <Edit className="w-4 h-4 group-hover:-rotate-12 transition-transform" />
              Edit Profile
            </button>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleOpenCvModal}
                className="group flex items-center justify-center gap-2 py-3 bg-[#A7F3D0] text-black border-4 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] font-black uppercase tracking-widest text-xs hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:translate-x-[4px] active:translate-y-[4px]"
              >
                <FileText className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
                Generate CV
              </button>
              <button
                onClick={handleShare}
                className="group flex items-center justify-center gap-2 py-3 bg-white text-black border-4 border-black dark:shadow-[4px_4px_0_0_#fff] shadow-[4px_4px_0_0_#000] font-black uppercase tracking-widest text-xs hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:translate-x-[4px] active:translate-y-[4px]"
              >
                {shared ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Share2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
                )}
                {shared ? "Copied!" : "Share"}
              </button>
            </div>
            <button
              onClick={handleOpenAnalyzer}
              className="group w-full flex items-center justify-center gap-2 py-3 bg-[#FDE68A] text-black border-4 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] font-black uppercase tracking-widest text-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:translate-x-[4px] active:translate-y-[4px]"
            >
              <ScanLine className="w-4 h-4 group-hover:scale-110 transition-transform" />
              CV Analyzer
            </button>
          </div>

          {/* Upload CV Button */}
          <div className="flex flex-col gap-3">
            <input
              ref={cvUploadInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadCv(file);
              }}
              className="hidden"
              id="cv-upload-input"
            />
            <button
              onClick={() => cvUploadInputRef.current?.click()}
              disabled={isUploadingCv}
              className="group w-full flex items-center justify-center gap-2 py-3 bg-[#0EA5E9] text-white border-4 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] font-black uppercase tracking-widest text-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:translate-x-[4px] active:translate-y-[4px] disabled:opacity-50"
            >
              {isUploadingCv ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
                  Upload CV
                </>
              )}
            </button>
          </div>

          {/* CV Display Section */}
          {cvData && (
            <div className="bg-card border-4 border-black dark:border-white p-5 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] space-y-4">
              <Typography
                variant="h4"
                className="border-b-4 border-black dark:border-white pb-2 mb-4 flex items-center gap-2"
              >
                <FileCheck className="w-5 h-5" />
                My CV
              </Typography>

              {/* CV Card — clickable to open viewer */}
              {canPreviewUploadedCv ? (
                <button
                  onClick={() => setIsCvViewerOpen(true)}
                  className="w-full group relative bg-gray-100 dark:bg-gray-800 border-4 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all overflow-hidden text-left"
                >
                  <div className="absolute top-0 left-0 w-16 h-16 bg-[#F43F5E]/80 rounded-br-[40px] z-10" />
                  <div className="absolute top-3 left-3 z-10">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white bg-black/50 px-2 py-1 border border-white/50 backdrop-blur-sm">
                      Featured
                    </span>
                  </div>

                  <div className="relative w-full h-[200px] overflow-hidden bg-white group-hover:scale-[1.02] transition-transform duration-500">
                    <div className="absolute inset-0 z-10 bg-black/5 group-hover:bg-transparent transition-colors" />
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

                  <div className="relative z-10 bg-black text-white p-3 border-t-4 border-black">
                    <Typography variant="span" className="text-sm font-bold block truncate">
                      {cvData.fileName}
                    </Typography>
                    <Typography variant="span" className="text-white/70 text-xs font-medium flex items-center gap-1 mt-1">
                      <Eye className="w-3 h-3" />
                      {uploadedCvPreviewError
                        ? "Preview unavailable in Firefox? Use download below."
                        : isUploadedCvPreviewLoading
                          ? "Preparing preview..."
                          : "Click to view full screen"}
                    </Typography>
                  </div>
                </button>
              ) : (
                <div className="w-full bg-gray-100 dark:bg-gray-800 border-4 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] overflow-hidden text-left">
                  <div className="flex h-[200px] flex-col items-center justify-center gap-3 bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.18),_transparent_55%)] px-6 text-center">
                    <FileCheck className="h-12 w-12" />
                    <Typography variant="h4" className="uppercase">
                      CV Saved
                    </Typography>
                    <Typography variant="p" className="text-sm text-muted-foreground">
                      Preview isn&apos;t available for this file type, but your CV is linked to your profile and ready to download.
                    </Typography>
                  </div>
                  <div className="bg-black p-3 text-white border-t-4 border-black">
                    <Typography variant="span" className="text-sm font-bold block truncate">
                      {cvData.fileName}
                    </Typography>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <a
                  href={cvData.url}
                  download={cvData.fileName}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-card text-foreground border-2 border-border font-black uppercase tracking-widest text-[10px] shadow-[2px_2px_0_0_var(--border)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                >
                  <Download className="w-3 h-3" />
                  Download
                </a>
                <button
                  onClick={handleDeleteCv}
                  className="flex items-center justify-center gap-2 py-2 px-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-2 border-red-300 dark:border-red-700 font-black uppercase tracking-widest text-[10px] shadow-[2px_2px_0_0_#fca5a5] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
          {/* Contact & Links */}
          <div className="bg-card border-4 border-black dark:border-white p-5 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] space-y-4">
            <Typography
              variant="h4"
              className="border-b-4 border-black dark:border-white pb-2 mb-4"
            >
              Connect
            </Typography>

            <a
              href={`mailto:${profileEmail}`}
              className="flex items-center gap-3 p-2 hover:bg-muted transition-colors border-2 border-transparent hover:border-black dark:hover:border-white"
            >
              <div className="p-2 bg-[#FDE68A] border-2 border-black dark:border-white text-black shadow-[2px_2px_0_0_#000]">
                <Mail className="w-4 h-4" />
              </div>
              <span className="text-sm font-bold truncate text-blue-600 dark:text-blue-400">{profileEmail}</span>
            </a>

            {profilePortfolio && (
              <a
                href={profilePortfolio}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 hover:bg-muted transition-colors border-2 border-transparent hover:border-black dark:hover:border-white"
              >
                <div className="p-2 bg-[#E9D5FF] border-2 border-black dark:border-white text-black shadow-[2px_2px_0_0_#000]">
                  <LinkIcon className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold truncate text-blue-600 dark:text-blue-400">
                  {profilePortfolio.replace(/^https?:\/\//, "")}
                </span>
              </a>
            )}

            {profileGithub && (
              <a
                href={profileGithub}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 hover:bg-muted transition-colors border-2 border-transparent hover:border-black dark:hover:border-white"
              >
                <div className="p-2 bg-black border-2 border-black dark:border-white text-white dark:bg-white dark:text-black shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] ">
                  <Github className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold truncate text-blue-600 dark:text-blue-400">
                  {profileGithub.replace(/^https?:\/\//, "")}
                </span>
              </a>
            )}

            {profileLinkedin && (
              <a
                href={profileLinkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-2 hover:bg-muted transition-colors border-2 border-transparent hover:border-black dark:hover:border-white"
              >
                <div className="p-2 bg-[#0A66C2] border-2 border-black dark:border-white text-white shadow-[2px_2px_0_0_#000]">
                  <Linkedin className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold truncate text-blue-600 dark:text-blue-400">
                  {profileLinkedin.replace(/^https?:\/\//, "")}
                </span>
              </a>
            )}

            {studentProfile?.phone && (
              <div className="flex items-center gap-3 p-2 border-2 border-transparent">
                <div className="p-2 bg-[#D1FAE5] border-2 border-black dark:border-white text-black shadow-[2px_2px_0_0_#000]">
                  <Phone className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold truncate">{studentProfile.phone}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* RIGHT COLUMN: Skills & Tasks (2/3 Width) */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-8 flex flex-col gap-8 min-w-0"
        >
          {/* Skills Section */}
          <div className="space-y-4">
            <Typography variant="h3" className="flex items-center gap-3">
              <span className="p-1 bg-[#FDE68A] border-2 border-black text-black rotate-3 shadow-[2px_2px_0_0_#000]">
                <Zap className="size-9" />
              </span>
              Skills
            </Typography>

            <div className="flex flex-wrap gap-3">
              {profileSkills.length > 0 ? (
                profileSkills.map((skill) => (
                  <SkillBadgeWithTooltip
                    key={skill}
                    skill={skill}
                    skillXpData={skillXpData}
                  />
                ))
              ) : (
                <Typography variant="p" color="muted" className="italic mt-2">
                  No skills listed yet. Edit your profile to add some!
                </Typography>
              )}
            </div>
          </div>

          {/* Completed Tasks Overview */}
          <div className="space-y-4 flex-1">
            <Typography variant="h3" className="flex items-center gap-3">
              <span className="p-1 bg-[#A7F3D0] border-2 border-black text-black -rotate-3 shadow-[2px_2px_0_0_#000]">
                <Trophy className="size-9" />
              </span>
              Completed Tasks
            </Typography>

            <div className="space-y-4">
              {applications === undefined ? (
                <div className="flex justify-center p-12 bg-card border-4 border-border shadow-[4px_4px_0_0_var(--border)]">
                  <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                </div>
              ) : completedTasks.length === 0 ? (
                <div className="p-8 text-center bg-muted border-4 border-black dark:border-white border-dashed text-muted-foreground">
                  <Typography variant="h4" className="uppercase mb-2">
                    No completed tasks yet
                  </Typography>
                  <Typography variant="p" className="text-sm">
                    Complete tasks to build your portfolio and impress
                    employers.
                  </Typography>
                </div>
              ) : (
                completedTasks.map((app) => {
                  const isExpanded = expandedTaskId === app._id;
                  return (
                    <div
                      key={app._id}
                      className="bg-card border-4 border-border shadow-[4px_4px_0_0_var(--border)] transition-all"
                    >
                      <div className="p-5 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div className="flex-1 w-full min-w-0 pr-0 sm:pr-4">
                          <div className="flex flex-wrap gap-2 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest bg-[#047857] text-white px-2 py-0.5 border-2 border-border shadow-[2px_2px_0_0_var(--border)] flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Done
                            </span>
                          </div>

                          <Typography
                            variant="h4"
                            className="truncate block w-full"
                          >
                            {app.task.title}
                          </Typography>

                          <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-muted-foreground">
                            <span className="font-bold text-foreground bg-muted px-2 py-0.5 border border-border">
                              {app.task.companyName}
                            </span>
                            <span className="hidden sm:inline-block w-1.5 h-1.5 bg-black dark:bg-white rotate-45" />
                            <span className="flex items-center gap-1 font-medium">
                              Completed on{" "}
                              {new Date(app.acceptedAt).toLocaleDateString()}
                            </span>
                          </div>
                        </div>

                        <div className="shrink-0 pt-2 sm:pt-0">
                          <button
                            onClick={() =>
                              setExpandedTaskId(isExpanded ? null : app._id)
                            }
                            className="px-4 py-2 bg-transparent text-foreground border-2 border-border font-black uppercase tracking-widest text-xs hover:bg-foreground hover:text-background transition-colors"
                          >
                            {isExpanded ? "Hide Details" : "View Details"}
                          </button>
                        </div>
                      </div>

                      {/* Expandable Details Panel */}
                      <AnimatePresence initial={false}>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-5 pt-2 border-t-2 border-dashed border-border space-y-3">
                              {/* Description */}
                              {app.task.description && (
                                <div>
                                  <Typography variant="h4" className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                                    Description
                                  </Typography>
                                  <Typography variant="p" className="text-sm text-foreground leading-relaxed">
                                    {app.task.description}
                                  </Typography>
                                </div>
                              )}

                              {/* Meta Row */}
                              <div className="flex flex-wrap gap-2">
                                {app.task.category && (
                                  <span className="text-[10px] font-black uppercase tracking-widest bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 px-2 py-0.5 border border-blue-300 dark:border-blue-700">
                                    {app.task.category}
                                  </span>
                                )}
                                {app.task.skillLevel && (
                                  <span className="text-[10px] font-black uppercase tracking-widest bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 border border-amber-300 dark:border-amber-700">
                                    {app.task.skillLevel}
                                  </span>
                                )}
                              </div>

                              {/* Skills */}
                              {app.task.skills && app.task.skills.length > 0 && (
                                <div>
                                  <Typography variant="h4" className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                                    Skills Used
                                  </Typography>
                                  <div className="flex flex-wrap gap-1.5">
                                    {app.task.skills.map((s) => (
                                      <span
                                        key={s}
                                        className="text-[10px] font-bold uppercase tracking-wider bg-muted text-foreground px-2 py-0.5 border border-border"
                                      >
                                        {s}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* EDIT PROFILE MODAL */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsEditing(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] bg-background border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 pb-2">
                <Typography
                  variant="h3"
                  className="font-black uppercase text-foreground tracking-widest"
                >
                  Edit Profile
                </Typography>
                <button
                  onClick={() => setIsEditing(false)}
                  className="w-8 h-8 flex items-center justify-center border-2 border-border bg-transparent text-foreground shadow-[2px_2px_0_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">

                {/* Missing-fields banner shown when CV generation was blocked */}
                {cvBlockedFields.length > 0 && (
                  <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950 border-4 border-amber-400 dark:border-amber-500 shadow-[4px_4px_0_0_#d97706]">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-black uppercase tracking-widest text-amber-800 dark:text-amber-300 mb-1">Complete your profile to generate a CV</p>
                      <p className="text-xs text-amber-700 dark:text-amber-400 font-bold">Missing: {cvBlockedFields.join(" · ")}</p>
                    </div>
                    <button onClick={() => setCvBlockedFields([])} className="ml-auto shrink-0 text-amber-600 dark:text-amber-400 hover:text-amber-900">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                <div>
                  <Typography
                    variant="label"
                    className="uppercase tracking-widest text-sm font-black mb-2 block"
                  >
                    Professional Title
                  </Typography>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g. Frontend Developer"
                    className="w-full p-3 bg-card rounded-none border-2 border-border shadow-[4px_4px_0_0_var(--border)] focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[4px_4px_0_0_hsl(263,70%,50%)] dark:focus-visible:shadow-[4px_4px_0_0_hsl(290,70%,70%)] transition-all focus-visible:translate-x-[2px] focus-visible:translate-y-[2px]"
                  />
                </div>

                <div>
                  <Typography
                    variant="label"
                    className="uppercase tracking-widest text-sm font-black mb-2 block"
                  >
                    Bio / Description
                  </Typography>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Tell us about your passions and goals..."
                    rows={4}
                    className="w-full p-3 bg-card rounded-none border-2 border-border shadow-[4px_4px_0_0_var(--border)] focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[4px_4px_0_0_hsl(263,70%,50%)] dark:focus-visible:shadow-[4px_4px_0_0_hsl(290,70%,70%)] transition-all focus-visible:translate-x-[2px] focus-visible:translate-y-[2px] resize-none"
                  />
                </div>

                {/* ── Education ── */}
                <div className="pt-4 border-t-4 border-black dark:border-white border-dashed">
                  <Typography variant="h4" className="mb-4">Education</Typography>
                  <div className="space-y-4">

                    <div>
                      <Typography variant="label" className="uppercase tracking-widest text-xs font-black mb-1 block">
                        University
                      </Typography>
                      <select
                        value={formData.university}
                        onChange={(e) => setFormData({ ...formData, university: e.target.value })}
                        className="w-full p-3 bg-card rounded-none border-2 border-border shadow-[4px_4px_0_0_var(--border)] focus:outline-none focus:shadow-[4px_4px_0_0_hsl(263,70%,50%)] transition-all cursor-pointer text-sm"
                      >
                        <option value="">Select your university...</option>
                        {EGYPTIAN_UNIVERSITIES.map((uni) => (
                          <option key={uni} value={uni}>{uni}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <Typography variant="label" className="uppercase tracking-widest text-xs font-black mb-1 block">
                        College / Faculty
                      </Typography>
                      <div className="w-full p-3 bg-muted border-2 border-border text-muted-foreground text-sm italic select-none">
                        Faculty of Computing and Information Technology
                      </div>
                    </div>

                    <div>
                      <Typography variant="label" className="uppercase tracking-widest text-xs font-black mb-1 block">
                        Bachelor&apos;s Degree Name
                      </Typography>
                      <input
                        type="text"
                        value={formData.degree}
                        onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                        placeholder="e.g. Bachelor of Science in Computer Science"
                        className="w-full p-3 bg-card rounded-none border-2 border-border shadow-[4px_4px_0_0_var(--border)] focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[4px_4px_0_0_hsl(263,70%,50%)] dark:focus-visible:shadow-[4px_4px_0_0_hsl(290,70%,70%)] transition-all focus-visible:translate-x-[2px] focus-visible:translate-y-[2px]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Typography variant="label" className="uppercase tracking-widest text-xs font-black mb-1 block">
                          Graduation Year
                        </Typography>
                        <input
                          type="number"
                          value={formData.graduationYear}
                          onChange={(e) => setFormData({ ...formData, graduationYear: e.target.value })}
                          placeholder="e.g. 2026"
                          min={1990}
                          max={2035}
                          className="w-full p-3 bg-card rounded-none border-2 border-border shadow-[4px_4px_0_0_var(--border)] focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[4px_4px_0_0_hsl(263,70%,50%)] dark:focus-visible:shadow-[4px_4px_0_0_hsl(290,70%,70%)] transition-all focus-visible:translate-x-[2px] focus-visible:translate-y-[2px]"
                        />
                      </div>
                      <div>
                        <Typography variant="label" className="uppercase tracking-widest text-xs font-black mb-1 block">
                          GPA (0.0 – 4.0)
                        </Typography>
                        <input
                          type="number"
                          value={formData.gpa}
                          onChange={(e) => setFormData({ ...formData, gpa: e.target.value })}
                          placeholder="e.g. 3.7"
                          min={0}
                          max={4}
                          step={0.01}
                          className="w-full p-3 bg-card rounded-none border-2 border-border shadow-[4px_4px_0_0_var(--border)] focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[4px_4px_0_0_hsl(263,70%,50%)] dark:focus-visible:shadow-[4px_4px_0_0_hsl(290,70%,70%)] transition-all focus-visible:translate-x-[2px] focus-visible:translate-y-[2px]"
                        />
                      </div>
                    </div>

                  </div>
                </div>

                <div className="pt-4 border-t-4 border-black dark:border-white border-dashed">
                  <Typography variant="h4" className="mb-4">
                    Links
                  </Typography>

                  <div className="space-y-4">
                    <div>
                      <Typography
                        variant="label"
                        className="uppercase tracking-widest text-xs font-black mb-1 block"
                      >
                        Portfolio URL
                      </Typography>
                      <input
                        type="url"
                        value={formData.portfolio}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            portfolio: e.target.value,
                          })
                        }
                        placeholder="https://..."
                        className="w-full p-2 bg-card rounded-none border-2 border-border shadow-[4px_4px_0_0_var(--border)] focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[4px_4px_0_0_hsl(263,70%,50%)] dark:focus-visible:shadow-[4px_4px_0_0_hsl(290,70%,70%)] transition-all focus-visible:translate-x-[2px] focus-visible:translate-y-[2px]"
                      />
                    </div>
                    <div>
                      <Typography
                        variant="label"
                        className="uppercase tracking-widest text-xs font-black mb-1 block"
                      >
                        GitHub URL
                      </Typography>
                      <input
                        type="url"
                        value={formData.github}
                        onChange={(e) =>
                          setFormData({ ...formData, github: e.target.value })
                        }
                        placeholder="https://github.com/..."
                        className="w-full p-2 bg-card rounded-none border-2 border-border shadow-[4px_4px_0_0_var(--border)] focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[4px_4px_0_0_hsl(263,70%,50%)] dark:focus-visible:shadow-[4px_4px_0_0_hsl(290,70%,70%)] transition-all focus-visible:translate-x-[2px] focus-visible:translate-y-[2px]"
                      />
                    </div>
                    <div>
                      <Typography
                        variant="label"
                        className="uppercase tracking-widest text-xs font-black mb-1 block"
                      >
                        LinkedIn URL
                      </Typography>
                      <input
                        type="url"
                        value={formData.linkedin}
                        onChange={(e) =>
                          setFormData({ ...formData, linkedin: e.target.value })
                        }
                        placeholder="https://linkedin.com/in/..."
                        className="w-full p-2 bg-card rounded-none border-2 border-border shadow-[4px_4px_0_0_var(--border)] focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[4px_4px_0_0_hsl(263,70%,50%)] dark:focus-visible:shadow-[4px_4px_0_0_hsl(290,70%,70%)] transition-all focus-visible:translate-x-[2px] focus-visible:translate-y-[2px]"
                      />
                    </div>
                  </div>
                </div>

                {/* ── Contact & Location ── */}
                <div className="pt-4 border-t-4 border-black dark:border-white border-dashed">
                  <Typography variant="h4" className="mb-4">Contact &amp; Location</Typography>
                  <div className="space-y-4">

                    <div>
                      <Typography variant="label" className="uppercase tracking-widest text-xs font-black mb-1 block">
                        Phone Number
                      </Typography>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="e.g. +20 100 000 0000"
                        className="w-full p-3 bg-card rounded-none border-2 border-border shadow-[4px_4px_0_0_var(--border)] focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[4px_4px_0_0_hsl(263,70%,50%)] dark:focus-visible:shadow-[4px_4px_0_0_hsl(290,70%,70%)] transition-all focus-visible:translate-x-[2px] focus-visible:translate-y-[2px]"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Typography variant="label" className="uppercase tracking-widest text-xs font-black mb-1 block">
                          City
                        </Typography>
                        <select
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="w-full p-3 bg-card rounded-none border-2 border-border shadow-[4px_4px_0_0_var(--border)] focus:outline-none focus:shadow-[4px_4px_0_0_hsl(263,70%,50%)] transition-all cursor-pointer text-sm"
                        >
                          <option value="">Select city...</option>
                          {EGYPTIAN_CITIES.map((city) => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Typography variant="label" className="uppercase tracking-widest text-xs font-black mb-1 block">
                          Country
                        </Typography>
                        <div className="w-full p-3 bg-muted border-2 border-border text-muted-foreground text-sm italic select-none">
                          Egypt
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="pt-4 border-t-4 border-black dark:border-white border-dashed">
                  <Typography
                    variant="label"
                    className="uppercase tracking-widest text-sm font-black mb-2 block"
                  >
                    Skills
                  </Typography>

                  {/* Selected Skills Tags */}
                  <div className="flex flex-wrap gap-2 mb-3">
                    {formData.skills.map((skill) => {
                      const iconClass = getDeviconClass(skill);
                      return (
                        <span
                          key={skill}
                          className="flex items-center gap-2 py-1 px-3 bg-[#FDE68A] text-black border-2 border-black shadow-[2px_2px_0_0_#000] text-xs font-bold uppercase tracking-wider"
                        >
                          {iconClass && (
                            <i className={`${iconClass} text-sm`} />
                          )}
                          {skill}
                          <button
                            onClick={() => removeSkill(skill)}
                            className="hover:text-red-600 focus:outline-none ml-1"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>

                  {/* Skill Search Input */}
                  <div className="flex flex-col sm:flex-row gap-2 mb-3">
                    <input
                      type="text"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleAddSkill}
                      placeholder="Search skills or type a custom one..."
                      className="flex-1 p-3 bg-card rounded-none border-2 border-border shadow-[4px_4px_0_0_var(--border)] focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[4px_4px_0_0_hsl(263,70%,50%)] dark:focus-visible:shadow-[4px_4px_0_0_hsl(290,70%,70%)] transition-all focus-visible:translate-x-[2px] focus-visible:translate-y-[2px]"
                    />
                    {showCustomAdd && (
                      <button
                        onClick={() =>
                          handleAddSkill({
                            key: "Enter",
                            preventDefault: () => {},
                          } as React.KeyboardEvent<HTMLInputElement>)
                        }
                        className="p-3 bg-black text-white dark:bg-white dark:text-black border-4 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] font-black uppercase whitespace-nowrap"
                      >
                        Add &quot;{skillInput.trim()}&quot;
                      </button>
                    )}
                  </div>

                  {/* Filtered Catalog Badges */}
                  <div className="p-3 border-4 border-black dark:border-white bg-card shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]">
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto pr-1 custom-scrollbar">
                      {filteredCatalog.length > 0
                        ? filteredCatalog.map((skill) => {
                            const isSelected = formData.skills.includes(skill);
                            if (isSelected) return null;
                            const iconClass = getDeviconClass(skill);
                            return (
                              <button
                                key={skill}
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    skills: [...formData.skills, skill],
                                  });
                                  setSkillInput("");
                                }}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-background border-2 border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors shadow-[2px_2px_0_0_#000] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                              >
                                {iconClass && <i className={iconClass} />}
                                <span className="text-xs font-bold">
                                  {skill}
                                </span>
                              </button>
                            );
                          })
                        : !showCustomAdd && (
                            <div className="w-full text-center py-4 text-muted-foreground italic text-sm">
                              <Typography variant="p" className="text-sm">
                                No skills found. You can still add it above!
                              </Typography>
                            </div>
                          )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t-4 border-black dark:border-white bg-[#A7F3D0] flex justify-end gap-4">
                <button
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="px-6 py-2 bg-transparent text-black border-4 border-black font-black uppercase tracking-widest hover:bg-black hover:text-[#A7F3D0] transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="px-8 py-2 bg-black text-[#A7F3D0] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all border-4 border-black shadow-[4px_4px_0_0_#000] font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CV GENERATION MODAL */}
      <AnimatePresence>
        {isCvModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseCvModal}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-3xl max-h-[90vh] bg-background border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff] flex flex-col overflow-hidden"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 pb-3 border-b-4 border-border">
                <div className="flex items-center gap-3">
                  {cvStep === "preview" && (
                    <button
                      onClick={() => setCvStep("select")}
                      className="w-8 h-8 flex items-center justify-center border-2 border-border bg-transparent text-foreground shadow-[2px_2px_0_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  <Typography
                    variant="h3"
                    className="font-black uppercase text-foreground tracking-widest"
                  >
                    {cvStep === "select" ? "Generate CV" : "Preview CV"}
                  </Typography>
                </div>
                <button
                  onClick={handleCloseCvModal}
                  className="w-8 h-8 flex items-center justify-center border-2 border-border bg-transparent text-foreground shadow-[2px_2px_0_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* STEP 1: Task Selection */}
              {cvStep === "select" && (
                <>
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    <Typography variant="p" className="text-sm font-medium">
                      Select which completed tasks to include as work experience in your CV:
                    </Typography>

                    {completedTasks.length === 0 ? (
                      <div className="p-6 text-center bg-muted border-4 border-border border-dashed">
                        <Typography variant="h4" className="uppercase mb-2">
                          No completed tasks
                        </Typography>
                        <Typography variant="p" className="text-sm text-muted-foreground">
                          Complete tasks first to include them as experience, or generate a CV with just your profile info.
                        </Typography>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {/* Select All / Deselect All */}
                        <div className="flex gap-2 mb-3">
                          <button
                            onClick={() =>
                              setSelectedTaskIds(
                                new Set(completedTasks.map((t) => t._id))
                              )
                            }
                            className="px-3 py-1.5 text-xs font-black uppercase tracking-wider border-2 border-border bg-card shadow-[2px_2px_0_0_var(--border)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                          >
                            Select All
                          </button>
                          <button
                            onClick={() => setSelectedTaskIds(new Set())}
                            className="px-3 py-1.5 text-xs font-black uppercase tracking-wider border-2 border-border bg-card shadow-[2px_2px_0_0_var(--border)] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all"
                          >
                            Deselect All
                          </button>
                        </div>

                        {completedTasks.map((app) => {
                          const isSelected = selectedTaskIds.has(app._id);
                          return (
                            <button
                              key={app._id}
                              onClick={() => toggleTaskSelection(app._id)}
                              className={`w-full text-left p-4 border-4 transition-all flex items-start gap-3 ${
                                isSelected
                                  ? "border-black dark:border-white bg-[#A7F3D0]/30 shadow-[4px_4px_0_0_var(--border)]"
                                  : "border-border bg-card shadow-[2px_2px_0_0_var(--border)] opacity-70 hover:opacity-100"
                              }`}
                            >
                              {/* Checkbox */}
                              <div
                                className={`shrink-0 mt-0.5 w-5 h-5 border-2 flex items-center justify-center transition-colors ${
                                  isSelected
                                    ? "bg-black dark:bg-white border-black dark:border-white"
                                    : "border-border bg-transparent"
                                }`}
                              >
                                {isSelected && (
                                  <Check className="w-3.5 h-3.5 text-white dark:text-black" />
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <Typography variant="h4" className="truncate">
                                  {app.task.title}
                                </Typography>
                                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                                  <span className="font-bold text-foreground bg-muted px-1.5 py-0.5 border border-border">
                                    {app.task.companyName}
                                  </span>
                                  <span className="font-medium">
                                    {app.task.category} · {app.task.skillLevel}
                                  </span>
                                </div>
                                {app.task.skills.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {app.task.skills.slice(0, 5).map((skill) => (
                                      <span
                                        key={skill}
                                        className="text-[10px] font-bold uppercase px-1.5 py-0.5 border border-border bg-muted"
                                      >
                                        {skill}
                                      </span>
                                    ))}
                                    {app.task.skills.length > 5 && (
                                      <span className="text-[10px] font-bold text-muted-foreground">
                                        +{app.task.skills.length - 5} more
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Error Display */}
                    {cvError && (
                      <div className="p-3 bg-red-100 dark:bg-red-900/30 border-4 border-red-500 text-red-800 dark:text-red-200 text-sm font-bold">
                        {cvError}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t-4 border-black dark:border-white bg-[#A7F3D0] flex justify-between items-center gap-4">
                    <Typography variant="span" className="text-xs font-bold text-black">
                      {selectedTaskIds.size} task{selectedTaskIds.size !== 1 ? "s" : ""} selected
                    </Typography>
                    <div className="flex gap-3">
                      <button
                        onClick={handleCloseCvModal}
                        className="px-5 py-2 bg-transparent text-black border-4 border-black font-black uppercase tracking-widest text-xs hover:bg-black hover:text-[#A7F3D0] transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleGenerateCV}
                        disabled={isGeneratingCv}
                        className="px-5 py-2 bg-black text-[#A7F3D0] border-4 border-black shadow-[4px_4px_0_0_#000] font-black uppercase tracking-widest text-xs hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {isGeneratingCv ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4" />
                            Generate & Preview
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}

              {/* STEP 2: PDF Preview */}
              {cvStep === "preview" && cvPdfBlobUrl && (
                <>
                  <div className="flex-1 overflow-hidden p-4">
                    <iframe
                      src={cvPdfBlobUrl}
                      title="CV Preview"
                      className="w-full h-full border-4 border-border shadow-[4px_4px_0_0_var(--border)] bg-white"
                      style={{ minHeight: "500px" }}
                    />
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t-4 border-black dark:border-white bg-[#A7F3D0] flex flex-wrap justify-between items-center gap-2">
                    <button
                      onClick={() => {
                        setCvStep("select");
                        if (cvPdfBlobUrl) {
                          URL.revokeObjectURL(cvPdfBlobUrl);
                          setCvPdfBlobUrl(null);
                        }
                      }}
                      className="px-5 py-2 bg-transparent text-black border-4 border-black font-black uppercase tracking-widest text-xs hover:bg-black hover:text-[#A7F3D0] transition-colors flex items-center gap-2"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Re-select Tasks
                    </button>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (cvData) {
                            setShowSaveConfirm(true);
                          } else {
                            handleSaveGeneratedCv();
                          }
                        }}
                        disabled={isSavingGeneratedCv}
                        className="px-5 py-2 bg-[#047857] text-white border-4 border-black shadow-[4px_4px_0_0_#000] font-black uppercase tracking-widest text-xs hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                        {isSavingGeneratedCv ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4" />
                            Save to Profile
                          </>
                        )}
                      </button>
                      <button
                        onClick={handleDownloadCv}
                        className="px-5 py-2 bg-black text-[#A7F3D0] border-4 border-black shadow-[4px_4px_0_0_#000] font-black uppercase tracking-widest text-xs hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CV ANALYZER MODAL */}
      <AnimatePresence>
        {isAnalyzerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAnalyzerOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-3xl max-h-[90vh] bg-background border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff] flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 pb-3 border-b-4 border-border">
                <div className="flex items-center gap-3">
                  {analyzerStep === "results" && (
                    <button
                      onClick={() => {
                        setAnalyzerStep("upload");
                        setAnalysisResult(null);
                        setAnalyzerError(null);
                      }}
                      className="w-8 h-8 flex items-center justify-center border-2 border-border bg-transparent text-foreground shadow-[2px_2px_0_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  )}
                  <Typography
                    variant="h3"
                    className="font-black uppercase text-foreground tracking-widest"
                  >
                    {analyzerStep === "upload" ? "CV Analyzer" : "ATS Analysis"}
                  </Typography>
                </div>
                <button
                  onClick={() => setIsAnalyzerOpen(false)}
                  className="w-8 h-8 flex items-center justify-center border-2 border-border bg-transparent text-foreground shadow-[2px_2px_0_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* UPLOAD STEP */}
              {analyzerStep === "upload" && (
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  <Typography variant="p" className="text-sm font-medium">
                    Upload your CV as a PDF to get an ATS compatibility score and
                    personalized recommendations for the{" "}
                    <span className="font-black">
                      {studentProfile?.fieldOfStudy || "your"}
                    </span>{" "}
                    field.
                  </Typography>

                  {/* Drop Zone */}
                  <label
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    className={`flex flex-col items-center justify-center gap-4 p-10 border-4 border-dashed cursor-pointer transition-all ${
                      isDragging
                        ? "border-[#2563EB] bg-blue-50 dark:bg-blue-950/20 scale-[1.02]"
                        : isAnalyzing
                          ? "border-border bg-muted opacity-60 cursor-wait"
                          : "border-border bg-card hover:border-black dark:hover:border-white hover:bg-muted"
                    }`}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-12 h-12 animate-spin text-[#2563EB]" />
                        <div className="text-center">
                          <Typography variant="h4" className="uppercase">
                            Analyzing {uploadedFileName}...
                          </Typography>
                          <Typography
                            variant="p"
                            className="text-sm text-muted-foreground mt-1"
                          >
                            Extracting text and running ATS evaluation
                          </Typography>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-4 bg-[#FDE68A] border-4 border-black shadow-[4px_4px_0_0_#000] rotate-3">
                          <Upload className="w-8 h-8 text-black" />
                        </div>
                        <div className="text-center">
                          <Typography variant="h4" className="uppercase">
                            Drop your CV here
                          </Typography>
                          <Typography
                            variant="p"
                            className="text-sm text-muted-foreground mt-1"
                          >
                            or click to browse — PDF only, max 10MB
                          </Typography>
                        </div>
                        <input
                          type="file"
                          accept=".pdf,application/pdf"
                          onChange={handleFileInputChange}
                          className="hidden"
                          disabled={isAnalyzing}
                        />
                      </>
                    )}
                  </label>

                  {/* Use Current CV Option */}
                  {cvData && canPreviewUploadedCv && !isAnalyzing && (
                    <div className="flex items-center gap-3 p-4 bg-[#A7F3D0]/30 border-4 border-[#047857]/40 shadow-[2px_2px_0_0_#047857]">
                      <FileCheck className="w-5 h-5 text-[#047857] shrink-0" />
                      <div className="flex-1 min-w-0">
                        <Typography variant="span" className="text-sm font-black block">
                          Use your uploaded CV
                        </Typography>
                        <Typography variant="span" className="text-xs text-muted-foreground truncate block">
                          {cvData.fileName}
                        </Typography>
                      </div>
                      <button
                        onClick={handleAnalyzeCurrentCv}
                        className="shrink-0 px-4 py-2 bg-[#047857] text-white border-2 border-black font-black uppercase tracking-widest text-[10px] shadow-[2px_2px_0_0_#000] hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-none transition-all flex items-center gap-1.5"
                      >
                        <ScanLine className="w-3 h-3" />
                        Analyze
                      </button>
                    </div>
                  )}

                  {/* Error */}
                  {analyzerError && (
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 border-4 border-red-500 text-red-800 dark:text-red-200 text-sm font-bold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      {analyzerError}
                    </div>
                  )}
                </div>
              )}

              {/* RESULTS STEP */}
              {analyzerStep === "results" && analysisResult && (
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                  {/* Overall Score */}
                  <div className="flex flex-col sm:flex-row items-center gap-6 p-5 bg-card border-4 border-border shadow-[4px_4px_0_0_var(--border)]">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-24 h-24 flex items-center justify-center border-4 shadow-[4px_4px_0_0_var(--border)] ${getScoreBg(analysisResult.overallScore)}`}
                      >
                        <span
                          className={`text-4xl font-black ${getScoreColor(analysisResult.overallScore)}`}
                        >
                          {analysisResult.overallScore}
                        </span>
                      </div>
                      <Typography
                        variant="span"
                        className="text-xs font-black uppercase tracking-widest mt-2"
                      >
                        ATS Score
                      </Typography>
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <Typography variant="p" className="text-sm font-medium leading-relaxed">
                        {analysisResult.summary}
                      </Typography>
                      <Typography
                        variant="span"
                        className="text-xs text-muted-foreground mt-2 block"
                      >
                        Analyzed for: {studentProfile?.fieldOfStudy || "General"} roles
                      </Typography>
                    </div>
                  </div>

                  {/* Criteria Breakdown */}
                  <div className="space-y-3">
                    <Typography variant="h4" className="flex items-center gap-2 uppercase">
                      <Target className="w-4 h-4" />
                      Score Breakdown
                    </Typography>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {analysisResult.breakdown?.map(
                        (item: { criterion: string; score: number; comment: string }) => (
                          <div
                            key={item.criterion}
                            className="p-3 bg-card border-2 border-border shadow-[2px_2px_0_0_var(--border)] flex items-start gap-3"
                          >
                            <span
                              className={`text-lg font-black shrink-0 w-10 text-center ${getScoreColor(item.score)}`}
                            >
                              {item.score}
                            </span>
                            <div className="min-w-0">
                              <Typography variant="span" className="text-xs font-black uppercase block">
                                {item.criterion}
                              </Typography>
                              <Typography
                                variant="span"
                                className="text-xs text-muted-foreground block mt-0.5"
                              >
                                {item.comment}
                              </Typography>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Strengths */}
                  {analysisResult.strengths?.length > 0 && (
                    <div className="space-y-2">
                      <Typography variant="h4" className="flex items-center gap-2 uppercase">
                        <TrendingUp className="w-4 h-4" />
                        Strengths
                      </Typography>
                      <div className="space-y-1">
                        {analysisResult.strengths.map((s: string, i: number) => (
                          <div
                            key={i}
                            className="flex items-start gap-2 p-2 bg-emerald-50 dark:bg-emerald-950/20 border-2 border-emerald-300 dark:border-emerald-700"
                          >
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            <Typography variant="span" className="text-sm">
                              {s}
                            </Typography>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {analysisResult.recommendations?.length > 0 && (
                    <div className="space-y-2">
                      <Typography variant="h4" className="flex items-center gap-2 uppercase">
                        <Zap className="w-4 h-4" />
                        Recommendations
                      </Typography>
                      <div className="space-y-2">
                        {analysisResult.recommendations.map(
                          (
                            rec: { priority: string; title: string; description: string },
                            i: number
                          ) => (
                            <div
                              key={i}
                              className="p-3 bg-card border-4 border-border shadow-[2px_2px_0_0_var(--border)]"
                            >
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`text-[10px] font-black uppercase px-2 py-0.5 border-2 border-black ${getPriorityColor(rec.priority)}`}
                                >
                                  {rec.priority}
                                </span>
                                <Typography variant="span" className="text-sm font-black">
                                  {rec.title}
                                </Typography>
                              </div>
                              <Typography
                                variant="p"
                                className="text-sm text-muted-foreground leading-relaxed"
                              >
                                {rec.description}
                              </Typography>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {/* Missing Keywords */}
                  {analysisResult.missingKeywords?.length > 0 && (
                    <div className="space-y-2">
                      <Typography variant="h4" className="flex items-center gap-2 uppercase">
                        <AlertTriangle className="w-4 h-4" />
                        Missing Keywords for {studentProfile?.fieldOfStudy || "Your Field"}
                      </Typography>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.missingKeywords.map((kw: string) => (
                          <span
                            key={kw}
                            className="px-3 py-1.5 text-xs font-black uppercase border-2 border-red-400 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300 shadow-[2px_2px_0_0_#fca5a5]"
                          >
                            + {kw}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              {analyzerStep === "results" && (
                <div className="p-4 border-t-4 border-black dark:border-white bg-[#FDE68A] flex justify-between items-center">
                  <button
                    onClick={() => {
                      setAnalyzerStep("upload");
                      setAnalysisResult(null);
                    }}
                    className="px-5 py-2 bg-transparent text-black border-4 border-black font-black uppercase tracking-widest text-xs hover:bg-black hover:text-[#FDE68A] transition-colors flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Analyze Another
                  </button>
                  <button
                    onClick={() => setIsAnalyzerOpen(false)}
                    className="px-6 py-2 bg-black text-[#FDE68A] border-4 border-black shadow-[4px_4px_0_0_#000] font-black uppercase tracking-widest text-xs hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                  >
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* CV VIEWER MODAL */}
      <AnimatePresence>
        {isCvViewerOpen && cvData && canPreviewUploadedCv && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCvViewerOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative flex max-h-[90vh] min-h-0 w-full max-w-4xl flex-col overflow-hidden bg-background border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff]"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-5 pb-3 border-b-4 border-border">
                <Typography
                  variant="h3"
                  className="font-black uppercase text-foreground tracking-widest flex items-center gap-2"
                >
                  <FileCheck className="w-5 h-5" />
                  {cvData.fileName}
                </Typography>
                <button
                  onClick={() => setIsCvViewerOpen(false)}
                  className="w-8 h-8 flex items-center justify-center border-2 border-border bg-transparent text-foreground shadow-[2px_2px_0_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* PDF Viewer */}
              <div className="flex-1 min-h-0 overflow-y-auto p-4">
                {uploadedCvPdfData ? (
                  <div
                    className="min-h-full border-4 border-border bg-[#F8FAFC] p-3 shadow-[4px_4px_0_0_var(--border)]"
                  >
                    <UploadedCvPdfRenderer
                      pdfData={uploadedCvPdfData}
                      mode="document"
                    />
                  </div>
                ) : (
                  <div
                    className="flex min-h-[500px] w-full flex-col items-center justify-center gap-4 border-4 border-border bg-white px-6 text-center shadow-[4px_4px_0_0_var(--border)]"
                  >
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
                          Firefox is loading a browser-safe preview of your PDF.
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

              {/* Footer */}
              <div className="p-4 border-t-4 border-black dark:border-white bg-[#0EA5E9] flex justify-between items-center">
                <button
                  onClick={() => setIsCvViewerOpen(false)}
                  className="px-5 py-2 bg-transparent text-white border-4 border-white font-black uppercase tracking-widest text-xs hover:bg-white hover:text-[#0EA5E9] transition-colors"
                >
                  Close
                </button>
                <a
                  href={cvData.url}
                  download={cvData.fileName}
                  className="px-6 py-2 bg-white text-[#0EA5E9] border-4 border-white shadow-[4px_4px_0_0_rgba(255,255,255,0.3)] font-black uppercase tracking-widest text-xs hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SAVE CV CONFIRMATION DIALOG */}
      <AnimatePresence>
        {showSaveConfirm && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSaveConfirm(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-md bg-background border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff] p-6 space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-950 border-2 border-amber-400 text-amber-600 shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <Typography variant="h4" className="uppercase mb-1">
                    Replace Existing CV?
                  </Typography>
                  <Typography variant="p" className="text-sm text-muted-foreground">
                    You already have a CV saved to your profile. Saving this
                    generated CV will <span className="font-black text-foreground">replace</span> your
                    current one. This action cannot be undone.
                  </Typography>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t-4 border-border">
                <button
                  onClick={() => setShowSaveConfirm(false)}
                  disabled={isSavingGeneratedCv}
                  className="px-5 py-2 bg-transparent text-foreground border-4 border-border font-black uppercase tracking-widest text-xs hover:bg-foreground hover:text-background transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveGeneratedCv}
                  disabled={isSavingGeneratedCv}
                  className="px-5 py-2 bg-[#F43F5E] text-white border-4 border-black shadow-[4px_4px_0_0_#000] font-black uppercase tracking-widest text-xs hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSavingGeneratedCv ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Replace & Save
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
