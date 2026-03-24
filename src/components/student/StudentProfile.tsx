"use client";

import { useUser } from "@clerk/nextjs";
import { Typography } from "@/components/ui/Typography";
import Image from "next/image";
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
} from "lucide-react";
import { useState, useEffect } from "react";
import deviconData from "devicon/devicon.json";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

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

const SKILL_CATALOG = [
  "JavaScript",
  "TypeScript",
  "Python",
  "Java",
  "Csharp",
  "Go",
  "Rust",
  "PHP",
  "Ruby",
  "Swift",
  "Kotlin",
  "Dart",
  "React",
  "Nextjs",
  "Vue",
  "Angular",
  "Svelte",
  "HTML",
  "CSS",
  "Tailwindcss",
  "Sass",
  "Nodejs",
  "Express",
  "Django",
  "Flask",
  "Spring",
  "Laravel",
  "Rails",
  "Flutter",
  "React Native",
  "Docker",
  "Kubernetes",
  "AWS",
  "Azure",
  "GCP",
  "Git",
  "GitHub",
  "Linux",
  "PostgreSQL",
  "MongoDB",
  "MySQL",
  "Redis",
  "Firebase",
  "GraphQL",
  "Figma",
  "Photoshop",
  "Illustrator",
  "Blender",
  "Unity",
  "TensorFlow",
  "PyTorch",
];

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

export default function StudentProfile() {
  const { user } = useUser();
  const applications = useQuery(api.tasks.getStudentApplications);
  const currentUserData = useQuery(api.users.currentUser);
  const globalPresence = useQuery(api.presence.listRoom, { roomId: "global:online" });
  const isOnline = globalPresence?.some(
    (u) => u.userId === currentUserData?.user?._id,
  );
  const upsertCurrentUser = useMutation(api.users.upsertCurrentUser);

  const studentProfile = currentUserData?.studentProfile;
  const dbUser = currentUserData?.user;

  // Profile Data Resolution
  const profileTitle = studentProfile?.title || DEFAULT_PROFILE.title;
  const profileLocation = studentProfile?.location || DEFAULT_PROFILE.location;
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
  });
  const [skillInput, setSkillInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
      });
    }
  }, [isEditing, studentProfile]);

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

              <div>
                <Typography variant="h2" className="mt-2 tracking-tighter">
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
              <button className="group flex items-center justify-center gap-2 py-3 bg-[#A7F3D0] text-black  border-4 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] font-black uppercase tracking-widest text-xs hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:translate-x-[4px] active:translate-y-[4px]">
                <Download className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
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
          </div>

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
              <span className="text-sm font-bold truncate">{profileEmail}</span>
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
                <span className="text-sm font-bold truncate">
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
                <span className="text-sm font-bold truncate">
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
                <span className="text-sm font-bold truncate">
                  {profileLinkedin.replace(/^https?:\/\//, "")}
                </span>
              </a>
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
                profileSkills.map((skill) => {
                  const devicon = getDeviconClass(skill);
                  return (
                    <div
                      key={skill}
                      className="flex items-center gap-2 py-2 px-4 bg-card border-4 border-border shadow-[4px_4px_0_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_var(--border)] transition-all cursor-default"
                    >
                      {devicon && <i className={`${devicon} text-lg`} />}
                      <Typography
                        variant="h4"
                        className="uppercase tracking-wide text-sm"
                      >
                        {skill}
                      </Typography>
                    </div>
                  );
                })
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
                completedTasks.map((app) => (
                  <div
                    key={app._id}
                    className="group relative p-5 bg-card border-4 border-border shadow-[4px_4px_0_0_var(--border)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center"
                  >
                    <div className="flex-1 w-full min-w-0 pr-0 sm:pr-4">
                      <div className="flex flex-wrap gap-2 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest bg-[#047857] text-white px-2 py-0.5 border-2 border-border shadow-[2px_2px_0_0_var(--border)] flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Done
                        </span>
                      </div>

                      <Typography
                        variant="h4"
                        className="truncate block w-full group-hover:text-blue-600 transition-colors"
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
                      <button className="px-4 py-2 bg-transparent text-foreground border-2 border-border font-black uppercase tracking-widest text-xs hover:bg-foreground hover:text-background transition-colors">
                        View Details
                      </button>
                    </div>
                  </div>
                ))
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
                    Location
                  </Typography>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                    placeholder="e.g. San Francisco, CA"
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
    </motion.div>
  );
}
