"use client";

import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Typography } from "@/components/ui/Typography";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import {
  X,
  Briefcase,
  MapPin,
  Mail,
  Link as LinkIcon,
  Github,
  Linkedin,
  Building2,
  Award,
  GraduationCap,
  Zap,
  Loader2,
} from "lucide-react";
import deviconData from "devicon/devicon.json";

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

interface ProfileViewModalProps {
  userId: Id<"users">;
  onClose: () => void;
}

export default function ProfileViewModal({
  userId,
  onClose,
}: ProfileViewModalProps) {
  const profile = useQuery(api.users.getPublicProfile, { userId });
  const globalPresence = useQuery(api.presence.listRoom, { roomId: "global:online" });
  const isOnline = globalPresence?.some(u => u.userId === profile?.name);

  // close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const isStudent = profile?.role === "student";
  const sp = profile?.studentProfile;
  const ep = profile?.employerProfile;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-200 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg max-h-[85vh] bg-background border-4 border-border shadow-[8px_8px_0_0_var(--border)] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between p-5 border-b-4 border-border ${
              isStudent ? "bg-[#2563EB]" : "bg-[#AB47BC]"
            }`}
          >
            <Typography
              variant="h3"
              className="font-black uppercase tracking-widest text-white text-lg"
            >
              {isStudent ? "Student" : "Employer"} Profile
            </Typography>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center border-2 border-white/50 text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Loading state */}
            {profile === undefined && (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mb-3" />
                <Typography
                  variant="p"
                  color="muted"
                  className="text-sm font-bold uppercase tracking-wider"
                >
                  Loading profile…
                </Typography>
              </div>
            )}

            {/* User not found */}
            {profile === null && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Typography variant="h3" className="mb-2">
                  Profile not found
                </Typography>
                <Typography variant="p" color="muted">
                  This user may have been removed.
                </Typography>
              </div>
            )}

            {/* Student Profile */}
            {profile && isStudent && (
              <div className="space-y-6">
                {/* Identity */}
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0 w-16 h-16">
                    <div className="w-full h-full border-4 border-border bg-[#2563EB] shadow-[4px_4px_0_0_var(--border)] flex items-center justify-center">
                      <span className="text-2xl font-black text-white">
                        {profile.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span 
                      className={`absolute -bottom-1 -right-1 size-4 ${isOnline ? "bg-green-500" : "bg-gray-400"} border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] z-10`}
                      title={isOnline ? "Online" : "Offline"}
                    />
                  </div>
                  <div className="min-w-0">
                    <Typography variant="h2" className="tracking-tighter">
                      {profile.name}
                    </Typography>
                    {sp?.title && (
                      <Typography
                        variant="h4"
                        color="muted"
                        className="flex items-center gap-1.5 mt-0.5"
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        {sp.title}
                      </Typography>
                    )}
                    {sp?.location && (
                      <Typography
                        variant="span"
                        color="muted"
                        className="flex items-center gap-1.5 mt-0.5 text-sm"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        {sp.location}
                      </Typography>
                    )}
                    {sp?.academicStatus && sp?.fieldOfStudy && (
                      <Typography
                        variant="span"
                        color="muted"
                        className="flex items-center gap-1.5 mt-0.5 text-sm"
                      >
                        <GraduationCap className="w-3.5 h-3.5" />
                        {sp.academicStatus.charAt(0).toUpperCase() +
                          sp.academicStatus.slice(1)}{" "}
                        in {sp.fieldOfStudy}
                      </Typography>
                    )}
                  </div>
                </div>

                {/* Bio */}
                {sp?.description && (
                  <div className="bg-card border-2 border-border p-4 shadow-[4px_4px_0_0_var(--border)]">
                    <Typography
                      variant="p"
                      className="text-sm leading-relaxed"
                    >
                      {sp.description}
                    </Typography>
                  </div>
                )}

                {/* Skills */}
                {sp?.skills && sp.skills.length > 0 && (
                  <div>
                    <Typography
                      variant="h4"
                      className="flex items-center gap-2 mb-3"
                    >
                      <span className="p-0.5 bg-[#FDE68A] border-2 border-border text-black shadow-[2px_2px_0_0_var(--border)]">
                        <Zap className="w-4 h-4" />
                      </span>
                      Skills
                    </Typography>
                    <div className="flex flex-wrap gap-2">
                      {sp.skills.map((skill) => {
                        const devicon = getDeviconClass(skill);
                        return (
                          <span
                            key={skill}
                            className="flex items-center gap-1.5 py-1.5 px-3 bg-card border-2 border-border shadow-[2px_2px_0_0_var(--border)] text-xs font-black uppercase tracking-wider"
                          >
                            {devicon && (
                              <i className={`${devicon} text-sm`} />
                            )}
                            {skill}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Links */}
                {(sp?.portfolio || sp?.github || sp?.linkedin) && (
                  <div className="space-y-2 pt-2 border-t-2 border-border">
                    <Typography variant="h4" className="mb-2">
                      Connect
                    </Typography>
                    <a
                      href={`mailto:${profile.email}`}
                      className="flex items-center gap-3 p-2 hover:bg-muted transition-colors border-2 border-transparent hover:border-border"
                    >
                      <div className="p-1.5 bg-[#FDE68A] border-2 border-border text-black shadow-[2px_2px_0_0_var(--border)]">
                        <Mail className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-sm font-bold truncate">
                        {profile.email}
                      </span>
                    </a>
                    {sp.portfolio && (
                      <a
                        href={sp.portfolio}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2 hover:bg-muted transition-colors border-2 border-transparent hover:border-border"
                      >
                        <div className="p-1.5 bg-[#E9D5FF] border-2 border-border text-black shadow-[2px_2px_0_0_var(--border)]">
                          <LinkIcon className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-bold truncate">
                          {sp.portfolio.replace(/^https?:\/\//, "")}
                        </span>
                      </a>
                    )}
                    {sp.github && (
                      <a
                        href={sp.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2 hover:bg-muted transition-colors border-2 border-transparent hover:border-border"
                      >
                        <div className="p-1.5 bg-black border-2 border-border text-white dark:bg-white dark:text-black shadow-[2px_2px_0_0_var(--border)]">
                          <Github className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-bold truncate">
                          {sp.github.replace(/^https?:\/\//, "")}
                        </span>
                      </a>
                    )}
                    {sp.linkedin && (
                      <a
                        href={sp.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-2 hover:bg-muted transition-colors border-2 border-transparent hover:border-border"
                      >
                        <div className="p-1.5 bg-[#0A66C2] border-2 border-border text-white shadow-[2px_2px_0_0_var(--border)]">
                          <Linkedin className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-sm font-bold truncate">
                          {sp.linkedin.replace(/^https?:\/\//, "")}
                        </span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Employer Profile */}
            {profile && !isStudent && (
              <div className="space-y-6">
                {/* Identity */}
                <div className="flex items-start gap-4">
                  <div className="relative shrink-0 w-16 h-16">
                    <div className="w-full h-full border-4 border-border bg-[#FCD34D] shadow-[4px_4px_0_0_var(--border)] flex items-center justify-center">
                      <span className="text-2xl font-black text-black">
                        {profile.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span 
                      className={`absolute -bottom-1 -right-1 size-4 ${isOnline ? "bg-green-500" : "bg-gray-400"} border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] z-10`}
                      title={isOnline ? "Online" : "Offline"}
                    />
                  </div>
                  <div className="min-w-0">
                    <Typography variant="h2" className="tracking-tighter">
                      {profile.name}
                    </Typography>
                    {ep?.position && (
                      <Typography
                        variant="h4"
                        color="muted"
                        className="flex items-center gap-1.5 mt-0.5"
                      >
                        <Briefcase className="w-3.5 h-3.5" />
                        {ep.position}
                      </Typography>
                    )}
                  </div>
                </div>

                {/* Company & Rank */}
                <div className="flex flex-wrap gap-3">
                  {ep?.companyName && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black text-white dark:bg-white dark:text-black border-2 border-border text-xs font-black uppercase tracking-wider shadow-[2px_2px_0_0_var(--border)]">
                      <Building2 className="w-3.5 h-3.5" />
                      {ep.companyName}
                    </span>
                  )}
                  {ep?.rankLevel && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#2563EB] text-white border-2 border-border text-xs font-black uppercase tracking-wider shadow-[2px_2px_0_0_var(--border)]">
                      <Award className="w-3.5 h-3.5" />
                      {ep.rankLevel}
                    </span>
                  )}
                </div>

                {/* Contact */}
                <div className="pt-4 border-t-2 border-border">
                  <Typography variant="h4" className="mb-2">
                    Contact
                  </Typography>
                  <a
                    href={`mailto:${profile.email}`}
                    className="flex items-center gap-3 p-2 hover:bg-muted transition-colors border-2 border-transparent hover:border-border"
                  >
                    <div className="p-1.5 bg-[#FDE68A] border-2 border-border text-black shadow-[2px_2px_0_0_var(--border)]">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-bold truncate">
                      {profile.email}
                    </span>
                  </a>
                </div>

                {/* Member Since */}
                <div className="pt-4 border-t-2 border-border text-center">
                  <Typography
                    variant="p"
                    color="muted"
                    className="text-sm font-bold"
                  >
                    Member since{" "}
                    {new Date(
                      profile.memberSince || 0,
                    ).toLocaleDateString()}
                  </Typography>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
