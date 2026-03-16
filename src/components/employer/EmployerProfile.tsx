"use client";

import { useUser } from "@clerk/nextjs";
import { Typography } from "@/components/ui/Typography";
import Image from "next/image";
import {
  Briefcase,
  Edit,
  Building2,
  Award,
  ClipboardList,
  CheckCircle2,
  Users,
  X,
  Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import CountUp from "@/components/CountUp";

// Type inference from Convex validation
type RankLevel =
  | "mid"
  | "senior"
  | "lead"
  | "manager"
  | "director"
  | "executive";

const DEFAULT_PROFILE = {
  companyName: "Add Company Name",
  position: "Add Position",
  rankLevel: "manager" as RankLevel,
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

export default function EmployerProfile() {
  const { user } = useUser();
  const currentUserData = useQuery(api.users.currentUser);
  const upsertCurrentUser = useMutation(api.users.upsertCurrentUser);
  const employerStats = useQuery(api.tasks.getEmployerStats);

  const employerProfile = currentUserData?.employerProfile;
  const dbUser = currentUserData?.user;

  // Profile Data Resolution
  const profileCompany =
    employerProfile?.companyName || DEFAULT_PROFILE.companyName;
  const profilePosition =
    employerProfile?.position || DEFAULT_PROFILE.position;
  const profileRank = employerProfile?.rankLevel || DEFAULT_PROFILE.rankLevel;

  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    position: "",
    rankLevel: "manager" as RankLevel,
  });
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when modal opens
  useEffect(() => {
    if (isEditing && employerProfile) {
      setFormData({
        companyName: employerProfile.companyName || "",
        position: employerProfile.position || "",
        rankLevel: (employerProfile.rankLevel as RankLevel) || "manager",
      });
    }
  }, [isEditing, employerProfile]);

  const handleSaveProfile = async () => {
    if (!employerProfile) return;
    setIsSaving(true);
    try {
      await upsertCurrentUser({
        role: "employer",
        employerProfile: {
          companyName: formData.companyName,
          position: formData.position,
          rankLevel: formData.rankLevel,
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

  const rankOptions: { value: RankLevel; label: string }[] = [
    { value: "mid", label: "Mid-level" },
    { value: "senior", label: "Senior" },
    { value: "lead", label: "Lead" },
    { value: "manager", label: "Manager" },
    { value: "director", label: "Director" },
    { value: "executive", label: "Executive (VP/C-Level)" },
  ];

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="space-y-8 pb-10 max-w-5xl mx-auto"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN: Identity & Actions (4/12 Width) */}
        <motion.div variants={itemVariants} className="lg:col-span-5 space-y-6">
          {/* Main Profile Card */}
          <div className="bg-card border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff] p-6 relative">
            <div className="absolute top-0 right-0 p-2 bg-[#EA4335] text-white border-b-4 border-l-4 border-black dark:border-white font-black text-xs uppercase tracking-widest">
              Employer
            </div>

            <div className="flex flex-col items-center text-center space-y-4 pt-4">
              {/* Brutalist Avatar */}
              <div className="w-32 h-32 border-4 border-black dark:border-white bg-[#FCD34D] shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] flex items-center justify-center overflow-hidden">
                {user?.imageUrl ? (
                  <Image
                    src={user.imageUrl}
                    alt="Profile"
                    width={128}
                    height={128}
                    className="w-full h-full object-cover mix-blend-hard-light"
                  />
                ) : (
                  <span className="text-4xl font-black text-black">
                    {(user?.firstName?.charAt(0) ?? "E").toUpperCase()}
                  </span>
                )}
              </div>

              <div>
                <Typography variant="h2" className="mt-2 tracking-tighter">
                  {user?.fullName ?? "Employer Name"}
                </Typography>
                <Typography
                  variant="h4"
                  color="muted"
                  className="mt-1 flex items-center justify-center gap-2"
                >
                  <Briefcase className="w-4 h-4" />
                  {profilePosition}
                </Typography>

                <div className="flex flex-wrap gap-2 justify-center mt-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-black text-white dark:bg-white dark:text-black border-2 border-black dark:border-white text-xs font-black uppercase tracking-wider shadow-[2px_2px_0_0_#2563EB]">
                    <Building2 className="w-3.5 h-3.5" />
                    {profileCompany}
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2563EB] text-white border-2 border-black dark:border-white text-xs font-black uppercase tracking-wider shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff]">
                    <Award className="w-3.5 h-3.5" />
                    {profileRank}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t-4 border-black dark:border-white text-center">
               <Typography variant="p" color="muted" className="text-sm font-bold">
                 Member since {new Date(dbUser?.createdAt || Date.now()).toLocaleDateString()}
               </Typography>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setIsEditing(true)}
              className="group w-full flex items-center justify-center gap-2 py-4 bg-[#2563EB] text-white border-4 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] font-black uppercase tracking-widest text-sm hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all active:translate-x-[4px] active:translate-y-[4px]"
            >
              <Edit className="w-4 h-4 group-hover:-rotate-12 transition-transform" />
              Edit Profile
            </button>
          </div>
        </motion.div>

        {/* RIGHT COLUMN: Stats & Impact (7/12 Width) */}
        <motion.div
          variants={itemVariants}
          className="lg:col-span-7 flex flex-col gap-8 min-w-0"
        >
          {/* Impact Overview Stats */}
          <div className="space-y-4">
            <Typography variant="h3" className="flex items-center gap-3">
              <span className="p-1 bg-[#AB47BC] border-2 border-black text-white rotate-3 shadow-[2px_2px_0_0_#000]">
                <ClipboardList className="size-8" />
              </span>
              Your Impact
            </Typography>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-card border-4 border-black dark:border-white p-6 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#2563EB] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-default">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-[#2563EB] text-white border-2 border-black shadow-[2px_2px_0_0_#000]">
                     <ClipboardList className="w-5 h-5" />
                  </div>
                  <Typography variant="h4" className="uppercase tracking-widest text-sm">Active Tasks</Typography>
                </div>
                <Typography variant="h1" className="text-4xl">
                   {employerStats === undefined ? <Loader2 className="animate-spin w-8 h-8 mt-2" /> : <CountUp from={0} to={employerStats.activeTasks} />}
                </Typography>
              </div>

              <div className="bg-card border-4 border-black dark:border-white p-6 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#AB47BC] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-default">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-[#AB47BC] text-white border-2 border-black shadow-[2px_2px_0_0_#000]">
                     <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <Typography variant="h4" className="uppercase tracking-widest text-sm">Completed Tasks</Typography>
                </div>
                <Typography variant="h1" className="text-4xl">
                   {employerStats === undefined ? <Loader2 className="animate-spin w-8 h-8 mt-2" /> : <CountUp from={0} to={employerStats.completedTasks} />}
                </Typography>
              </div>

              <div className="bg-card border-4 border-black dark:border-white p-6 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#10B981] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all cursor-default sm:col-span-2">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-[#10B981] text-white border-2 border-black shadow-[2px_2px_0_0_#000]">
                     <Users className="w-5 h-5" />
                  </div>
                  <Typography variant="h4" className="uppercase tracking-widest text-sm">Total Talent Submissions</Typography>
                </div>
                <div className="flex items-end justify-between">
                  <Typography variant="h1" className="text-5xl">
                     {employerStats === undefined ? <Loader2 className="animate-spin w-10 h-10 mt-2" /> : <CountUp from={0} to={employerStats.totalSubmissions} />}
                  </Typography>
                  <Typography variant="span" color="muted" className="font-bold mb-1">
                    students evaluated
                  </Typography>
                </div>
              </div>
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
              className="relative w-full max-w-xl max-h-[90vh] bg-background border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-6 pb-2 border-b-4 border-black dark:border-white">
                <Typography
                  variant="h3"
                  className="font-black uppercase text-foreground tracking-widest"
                >
                  Edit Employer Profile
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
                    Company Name
                  </Typography>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) =>
                      setFormData({ ...formData, companyName: e.target.value })
                    }
                    placeholder="e.g. Acme Corp"
                    className="w-full p-3 bg-card rounded-none border-2 border-border shadow-[4px_4px_0_0_var(--border)] focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[4px_4px_0_0_hsl(263,70%,50%)] dark:focus-visible:shadow-[4px_4px_0_0_hsl(290,70%,70%)] transition-all focus-visible:translate-x-[2px] focus-visible:translate-y-[2px]"
                  />
                </div>

                <div>
                  <Typography
                    variant="label"
                    className="uppercase tracking-widest text-sm font-black mb-2 block"
                  >
                    Your Position
                  </Typography>
                  <input
                    type="text"
                    value={formData.position}
                    onChange={(e) =>
                      setFormData({ ...formData, position: e.target.value })
                    }
                    placeholder="e.g. Senior Recruiter"
                    className="w-full p-3 bg-card rounded-none border-2 border-border shadow-[4px_4px_0_0_var(--border)] focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[4px_4px_0_0_hsl(263,70%,50%)] dark:focus-visible:shadow-[4px_4px_0_0_hsl(290,70%,70%)] transition-all focus-visible:translate-x-[2px] focus-visible:translate-y-[2px]"
                  />
                </div>

                <div>
                  <Typography
                    variant="label"
                    className="uppercase tracking-widest text-sm font-black mb-2 block"
                  >
                    Rank Level
                  </Typography>
                  <select
                    value={formData.rankLevel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rankLevel: e.target.value as RankLevel,
                      })
                    }
                    className="w-full p-3 bg-card rounded-none border-2 border-border shadow-[4px_4px_0_0_var(--border)] focus-visible:outline-none focus-visible:ring-0 focus-visible:shadow-[4px_4px_0_0_hsl(263,70%,50%)] dark:focus-visible:shadow-[4px_4px_0_0_hsl(290,70%,70%)] transition-all focus-visible:translate-x-[2px] focus-visible:translate-y-[2px] font-bold"
                  >
                    {rankOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-6 pt-4 border-t-4 border-black dark:border-white flex justify-end gap-4 bg-muted">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2.5 bg-transparent text-foreground border-2 border-border font-black uppercase tracking-widest hover:bg-card transition-colors shadow-[2px_2px_0_0_var(--border)]"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#2563EB] text-white border-2 border-black dark:border-white font-black uppercase tracking-widest hover:translate-x-[2px] hover:translate-y-[2px] shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] hover:shadow-none transition-all disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : null}
                  Save Profile
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
