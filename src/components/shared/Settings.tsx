"use client";

import { useState } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import {
  MAX_USER_NAME_FIELD_LENGTH,
  validateUserNameFields,
} from "../../../convex/nameLimits";
import { Typography } from "@/components/ui/Typography";
import { Loader2, Save, Shield, Github, Linkedin, Mail } from "lucide-react";

// Role-based theme config
const THEME = {
  student: {
    accent: "#2563EB",
    label: "Student",
  },
  employer: {
    accent: "#AB47BC",
    label: "Employer",
  },
} as const;

export default function Settings() {
  const { user, isLoaded } = useUser();
  const { openUserProfile } = useClerk();
  const currentUser = useQuery(api.users.currentUser);
  const syncCurrentUserNames = useMutation(api.users.syncCurrentUserNames);

  const role = (currentUser?.user?.role as "student" | "employer") || "student";
  const theme = THEME[role];

  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const checkConnection = (strategy: string) =>
    user?.externalAccounts.some(
      (acc) => acc.verification?.strategy === strategy,
    );

  const hasGithub = checkConnection("oauth_github");
  const hasGoogle = checkConnection("oauth_google");
  const hasLinkedin =
    checkConnection("oauth_linkedin") || checkConnection("oauth_linkedin_oidc");

  const handleSaveProfile = async () => {
    if (!user) return;
    const fn = firstName.trim();
    const ln = lastName.trim();
    const nameErr = validateUserNameFields(fn, ln);
    if (nameErr) {
      setMessage({ type: "error", text: nameErr });
      return;
    }
    setIsSaving(true);
    setMessage(null);
    try {
      await user.update({ firstName: fn, lastName: ln });
      await syncCurrentUserNames({
        firstName: fn,
        lastName: ln,
        email: user.primaryEmailAddress?.emailAddress,
      });
      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (error) {
      console.error(error);
      const errorMessage =
        error &&
        typeof error === "object" &&
        "errors" in error &&
        Array.isArray((error as { errors: unknown[] }).errors)
          ? (error as { errors: { message: string }[] }).errors[0]?.message
          : "Failed to update profile.";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-4xl mx-auto pb-12">
      <div className="flex flex-col gap-2">
        <Typography variant="h2" className="tracking-tighter">
          Settings
        </Typography>
        <Typography variant="p" color="muted">
          Manage your account details and security preferences.
        </Typography>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8">
        {/* Sidebar Nav */}
        <div className="flex flex-col gap-2">
          <button
            className="text-left px-4 py-3 font-black uppercase tracking-widest border-2 transition-colors text-white border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] cursor-default"
            style={{
              backgroundColor: theme.accent,
            }}
          >
            Account
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col gap-8">
          {/* Section: Profile */}
          <section
            className="bg-card border-4 border-black dark:border-white p-6 sm:p-8"
            style={{
              boxShadow: `8px 8px 0 0 ${theme.accent}`,
            }}
          >
            <Typography
              variant="h3"
              className="uppercase tracking-widest border-b-4 border-black dark:border-white pb-4 mb-6"
            >
              Profile Details
            </Typography>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-black uppercase tracking-widest">
                  First Name
                </label>
                <input
                  type="text"
                  value={firstName}
                  maxLength={MAX_USER_NAME_FIELD_LENGTH}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-transparent border-2 border-black dark:border-white p-3 font-medium focus:outline-none focus:ring-0 transition-colors"
                  style={{ borderColor: undefined }}
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = theme.accent)
                  }
                  onBlur={(e) => (e.currentTarget.style.borderColor = "")}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-black uppercase tracking-widest">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  maxLength={MAX_USER_NAME_FIELD_LENGTH}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-transparent border-2 border-black dark:border-white p-3 font-medium focus:outline-none focus:ring-0 transition-colors"
                  onFocus={(e) =>
                    (e.currentTarget.style.borderColor = theme.accent)
                  }
                  onBlur={(e) => (e.currentTarget.style.borderColor = "")}
                />
              </div>
            </div>
            <Typography variant="p" color="muted" className="text-xs font-medium mb-6">
              First and last name: up to {MAX_USER_NAME_FIELD_LENGTH} characters each
              (extra spaces are trimmed when you save).
            </Typography>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="w-full sm:w-auto">
                {message && (
                  <Typography
                    variant="span"
                    className={`text-sm font-bold ${message.type === "success" ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
                  >
                    {message.text}
                  </Typography>
                )}
              </div>
              <button
                onClick={handleSaveProfile}
                disabled={
                  isSaving ||
                  (firstName.trim() === (user?.firstName ?? "").trim() &&
                    lastName.trim() === (user?.lastName ?? "").trim())
                }
                className="w-full sm:w-auto px-6 py-3 text-white border-2 border-black dark:border-white font-black uppercase tracking-widest hover:translate-y-1 hover:translate-x-1 transition-all shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] hover:shadow-none disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-x-0 disabled:hover:translate-y-0 disabled:hover:shadow-[4px_4px_0_0_#000] dark:disabled:hover:shadow-[4px_4px_0_0_#fff] flex items-center justify-center gap-2"
                style={{ backgroundColor: theme.accent }}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </button>
            </div>
          </section>

          {/* Section: Connected Accounts */}
          <section
            className="bg-card border-4 border-black dark:border-white p-6 sm:p-8"
            style={{
              boxShadow: `8px 8px 0 0 ${theme.accent}`,
            }}
          >
            <Typography
              variant="h3"
              className="uppercase tracking-widest border-b-4 border-black dark:border-white pb-4 mb-6"
            >
              Connected Accounts
            </Typography>

            <div className="flex flex-col gap-4">
              {/* Google */}
              <div className="flex items-center justify-between border-2 border-black dark:border-white p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-[#EA4335] text-white p-2 border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#EA4335]">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <Typography variant="span" className="font-bold block">
                      Google
                    </Typography>
                    <Typography variant="caption" color="muted">
                      {hasGoogle ? "Connected" : "Not connected"}
                    </Typography>
                  </div>
                </div>
                {hasGoogle ? (
                  <span className="text-xs font-black uppercase tracking-widest px-3 py-1 bg-[#A7F3D0] text-[#064E3B] border-2 border-black">
                    Active
                  </span>
                ) : (
                  <button
                    onClick={() => openUserProfile()}
                    className="px-4 py-2 border-2 border-black dark:border-white font-black text-xs uppercase tracking-widest hover:bg-muted transition-colors"
                  >
                    Manage In Clerk
                  </button>
                )}
              </div>

              {/* GitHub */}
              <div className="flex items-center justify-between border-2 border-black dark:border-white p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-[#181717] text-white p-2 border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#181717]">
                    <Github className="w-5 h-5" />
                  </div>
                  <div>
                    <Typography variant="span" className="font-bold block">
                      GitHub
                    </Typography>
                    <Typography variant="caption" color="muted">
                      {hasGithub ? "Connected" : "Not connected"}
                    </Typography>
                  </div>
                </div>
                {hasGithub ? (
                  <span className="text-xs font-black uppercase tracking-widest px-3 py-1 bg-[#A7F3D0] text-[#064E3B] border-2 border-black">
                    Active
                  </span>
                ) : (
                  <button
                    onClick={() => openUserProfile()}
                    className="px-4 py-2 border-2 border-black dark:border-white font-black text-xs uppercase tracking-widest hover:bg-muted transition-colors"
                  >
                    Manage In Clerk
                  </button>
                )}
              </div>

              {/* LinkedIn */}
              <div className="flex items-center justify-between border-2 border-black dark:border-white p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-[#0A66C2] text-white p-2 border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#0A66C2]">
                    <Linkedin className="w-5 h-5" />
                  </div>
                  <div>
                    <Typography variant="span" className="font-bold block">
                      LinkedIn
                    </Typography>
                    <Typography variant="caption" color="muted">
                      {hasLinkedin ? "Connected" : "Not connected"}
                    </Typography>
                  </div>
                </div>
                {hasLinkedin ? (
                  <span className="text-xs font-black uppercase tracking-widest px-3 py-1 bg-[#A7F3D0] text-[#064E3B] border-2 border-black">
                    Active
                  </span>
                ) : (
                  <button
                    onClick={() => openUserProfile()}
                    className="px-4 py-2 border-2 border-black dark:border-white font-black text-xs uppercase tracking-widest hover:bg-muted transition-colors"
                  >
                    Manage In Clerk
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Section: Security */}
          <section
            className="bg-card border-4 border-black dark:border-white p-6 sm:p-8"
            style={{
              boxShadow: `8px 8px 0 0 ${theme.accent}`,
            }}
          >
            <Typography
              variant="h3"
              className="uppercase tracking-widest border-b-4 border-black dark:border-white pb-4 mb-6 flex items-center gap-2"
            >
              <Shield className="w-5 h-5" /> Security
            </Typography>

            <Typography variant="p" color="muted" className="mb-6">
              Manage your password, 2FA, primary email address, and active
              sessions through our secure identity provider.
            </Typography>

            <button
              onClick={() => openUserProfile()}
              className="w-full sm:w-auto px-6 py-3 text-white border-2 border-black dark:border-white font-black uppercase tracking-widest hover:translate-y-1 hover:translate-x-1 transition-all shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] hover:shadow-none"
              style={{
                backgroundColor: theme.accent,
              }}
            >
              Open Security Settings
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}
