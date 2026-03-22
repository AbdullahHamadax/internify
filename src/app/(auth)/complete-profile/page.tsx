// app/(auth)/complete-profile/page.tsx
"use client";

import { Building2, GraduationCap, LogOut, Upload, User } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useRef, useEffect } from "react";
import { Typography } from "@/components/ui/Typography";

import { zodResolver } from "@hookform/resolvers/zod";
import { useClerk, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "../../../../convex/_generated/api";

// ── Types & Schemas ──────────────────────────────────────

type Role = "student" | "employer";
type Step = 0 | 1;
type AcademicStatus = "undergraduate" | "graduate";

const studentProfileSchema = z.object({
  academicStatus: z.enum(["undergraduate", "graduate"]),
  fieldOfStudy: z.string().min(1, "Field of study is required").trim(),
});

const employerProfileSchema = z.object({
  companyName: z.string().min(1, "Company name is required").trim(),
  position: z.string().min(1, "Position is required").trim(),
  rankLevel: z.enum(
    ["mid", "senior", "lead", "manager", "director", "executive"],
    {
      message: "Please select your level",
    },
  ),
});

type StudentProfileData = z.infer<typeof studentProfileSchema>;
type EmployerProfileData = z.infer<typeof employerProfileSchema>;

// ── Component ────────────────────────────────────────────

export default function CompleteProfilePage() {
  const { isLoaded, user } = useUser();
  const { signOut } = useClerk();
  const upsertCurrentUser = useMutation(api.users.upsertCurrentUser);
  const currentUser = useQuery(api.users.currentUser);
  const router = useRouter();

  const [step, setStep] = useState<Step>(0);
  const [role, setRole] = useState<Role | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CV file (student only, optional)
  const [cvFile, setCvFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isEmployer = role === "employer";

  // ── Forms ──

  const studentForm = useForm<StudentProfileData>({
    resolver: zodResolver(studentProfileSchema),
    mode: "onTouched",
    defaultValues: { academicStatus: "undergraduate", fieldOfStudy: "" },
  });

  const employerForm = useForm<EmployerProfileData>({
    resolver: zodResolver(employerProfileSchema),
    mode: "onTouched",
    defaultValues: { companyName: "", position: "" },
  });

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!user) {
      router.replace("/login");
      return;
    }

    if (currentUser?.user?.role) {
      router.replace("/");
    }
  }, [isLoaded, user, currentUser, router]);

  // ── Loading ──
  if (!isLoaded || currentUser === undefined) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Keep content hidden while the redirect effect resolves auth/profile state.
  if (!user || currentUser?.user?.role) {
    return null;
  }

  // ── Helpers ──

  function selectRole(r: Role) {
    setRole(r);
    setStep(1);
    setSubmitError(null);
  }

  function goBack() {
    setSubmitError(null);
    setStep(0);
    setRole(null);
  }

  function pickFile() {
    fileInputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSubmitError(null);
    setCvFile(e.target.files?.[0] ?? null);
  }

  async function onStudentSubmit(data: StudentProfileData) {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await upsertCurrentUser({
        role: "student",
        firstName: user?.firstName ?? undefined,
        lastName: user?.lastName ?? undefined,
        email: user?.primaryEmailAddress?.emailAddress ?? undefined,
        studentProfile: {
          academicStatus: data.academicStatus,
          fieldOfStudy: data.fieldOfStudy,
          cvFileName: cvFile?.name ?? undefined,
        },
      });
      router.push("/");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save your profile.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onEmployerSubmit(data: EmployerProfileData) {
    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await upsertCurrentUser({
        role: "employer",
        firstName: user?.firstName ?? undefined,
        lastName: user?.lastName ?? undefined,
        email: user?.primaryEmailAddress?.emailAddress ?? undefined,
        employerProfile: {
          companyName: data.companyName,
          position: data.position,
          rankLevel: data.rankLevel,
        },
      });
      router.push("/");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not save your profile.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Step 0: Role picker ──

  if (step === 0 || !role) {
    return (
      <Card className="rounded-none border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff]">
        <CardHeader className="text-center space-y-2 px-4 sm:px-8 pt-8 rounded-none border-b-4 border-black dark:border-white pb-6 mb-6">
          <Typography variant="h2" className="text-2xl uppercase tracking-widest font-black text-center">Complete Your Profile</Typography>
          <CardDescription>
            You signed in with{" "}
            <strong>
              {user?.primaryEmailAddress?.emailAddress ?? "your social account"}
            </strong>
            . Choose how you want to use Internify.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4 sm:px-8 pb-6 space-y-4">
          <button
            type="button"
            onClick={() => selectRole("student")}
            aria-label="Continue as a student"
            className="group w-full flex items-start gap-4 p-5 rounded-none border-4 border-black dark:border-white bg-[#2563EB] text-left transition-all shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff] hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[8px_8px_0_0_#000] dark:hover:shadow-[8px_8px_0_0_#fff]"
          >
            <div className="p-3 border-2 border-black dark:border-white bg-white text-black transition-colors group-hover:bg-black group-hover:text-white">
              <User className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <Typography
                variant="span"
                className="block text-base font-black uppercase tracking-widest text-white"
              >
                I&apos;m a Student
              </Typography>
              <Typography variant="span" className="block text-white font-bold text-sm">
                Solve tasks, build your portfolio, and earn certificates.
              </Typography>
            </div>
          </button>

          <button
            type="button"
            onClick={() => selectRole("employer")}
            aria-label="Continue as an employer"
            className="group w-full flex items-start gap-4 p-5 rounded-none border-4 border-black dark:border-white bg-[#AB47BC] text-left transition-all shadow-[6px_6px_0_0_#000] dark:shadow-[6px_6px_0_0_#fff] hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[8px_8px_0_0_#000] dark:hover:shadow-[8px_8px_0_0_#fff]"
          >
            <div className="p-3 border-2 border-black dark:border-white bg-white text-black transition-colors group-hover:bg-black group-hover:text-white">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <Typography
                variant="span"
                className="block text-base font-black uppercase tracking-widest text-white"
              >
                I&apos;m an Employer
              </Typography>
              <Typography variant="span" className="block text-white font-bold text-sm">
                Post challenges and evaluate junior talent with AI.
              </Typography>
            </div>
          </button>
        </CardContent>

        <CardFooter className="flex-col items-center gap-3 pb-8">
          <Typography variant="span" color="muted" className="text-sm">
            Signed in as{" "}
            <Typography variant="span" weight="medium">
              {user?.primaryEmailAddress?.emailAddress}
            </Typography>
          </Typography>
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: "/login" })}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-red-600 dark:hover:text-red-400"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out or use a different account
          </button>
        </CardFooter>
      </Card>
    );
  }

  // ── Step 1: Profile form ──

  return (
    <Card className="rounded-none border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff]">
      <CardHeader className="px-4 sm:px-8 pt-8 rounded-none border-b-4 border-black dark:border-white pb-6 mb-6">
        {/* Role badge */}
        <div className="flex justify-center mb-1">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black uppercase tracking-widest border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] ${
              isEmployer
                ? "bg-[#AB47BC] text-white"
                : "bg-[#2563EB] text-white"
            }`}
          >
            {isEmployer ? (
              <Building2 className="h-3 w-3" />
            ) : (
              <User className="h-3 w-3" />
            )}
            {role} Account
          </span>
        </div>

        <div className="text-center space-y-1 pt-2">
          <Typography variant="h2" className="text-2xl uppercase tracking-widest font-black text-center">Complete Your Profile</Typography>
          <CardDescription className="text-black dark:text-white font-bold uppercase tracking-widest text-xs">Tell us more about yourself</CardDescription>
        </div>
      </CardHeader>

      <CardContent className="px-4 sm:px-8 pb-8 space-y-6">
        {submitError && (
          <Typography
            variant="p"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
          >
            {submitError}
          </Typography>
        )}

        {/* ── Student Profile ── */}
        {!isEmployer && (
          <form
            onSubmit={studentForm.handleSubmit(onStudentSubmit)}
            className="space-y-5"
            noValidate
          >
            <div className="space-y-2">
              <Label>Academic Status</Label>
              <ToggleGroup
                type="single"
                value={studentForm.watch("academicStatus")}
                onValueChange={(v) =>
                  v &&
                  studentForm.setValue("academicStatus", v as AcademicStatus, {
                    shouldValidate: true,
                  })
                }
                className="grid w-full grid-cols-1 sm:grid-cols-2 gap-3"
              >
                <ToggleGroupItem
                  value="undergraduate"
                  className={`w-full h-14 rounded-none border-2 border-black dark:border-white justify-center px-2 sm:px-3 text-xs sm:text-sm font-black uppercase tracking-widest transition-all shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] data-[state=on]:translate-x-[2px] data-[state=on]:translate-y-[2px] data-[state=on]:shadow-none data-[state=on]:bg-[#2563EB] data-[state=on]:text-white hover:-translate-y-1`}
                >
                  <GraduationCap className="mr-2 h-4 w-4 shrink-0" />
                  Undergrad
                </ToggleGroupItem>

                <ToggleGroupItem
                  value="graduate"
                  className={`w-full h-14 rounded-none border-2 border-black dark:border-white justify-center px-2 sm:px-3 text-xs sm:text-sm font-black uppercase tracking-widest transition-all shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] data-[state=on]:translate-x-[2px] data-[state=on]:translate-y-[2px] data-[state=on]:shadow-none data-[state=on]:bg-[#2563EB] data-[state=on]:text-white hover:-translate-y-1`}
                >
                  <GraduationCap className="mr-2 h-4 w-4 shrink-0" />
                  Graduate
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="field">Speciality / Field of Study</Label>
              <Input
                id="field"
                placeholder="e.g., Computer Science, Business, Design..."
                className="rounded-none border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] px-3 py-2 text-sm focus-visible:ring-offset-0 focus-visible:ring-0 focus-visible:border-black dark:focus-visible:border-white"
                {...studentForm.register("fieldOfStudy")}
                aria-invalid={!!studentForm.formState.errors.fieldOfStudy}
              />
              {studentForm.formState.errors.fieldOfStudy && (
                <Typography variant="p" className="text-xs text-red-500">
                  {studentForm.formState.errors.fieldOfStudy.message}
                </Typography>
              )}
            </div>

            <div className="space-y-2">
              <Label>Upload CV (Optional)</Label>

              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx"
                onChange={onFileChange}
              />

              <button
                type="button"
                onClick={pickFile}
                aria-label="Upload CV"
                className={`w-full rounded-none border-4 border-black dark:border-white p-4 text-left transition-all bg-white dark:bg-black text-black dark:text-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] hover:-translate-y-[2px] hover:-translate-x-[2px] hover:shadow-[6px_6px_0_0_#000] dark:hover:shadow-[6px_6px_0_0_#fff] focus:outline-none`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 border-2 border-black dark:border-white bg-[#2563EB] text-white`}
                  >
                    <Upload className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black uppercase tracking-widest text-sm truncate">
                      {cvFile ? cvFile.name : "Click to upload your CV"}
                    </div>
                    <div className="text-xs font-bold uppercase tracking-widest mt-1 opacity-70">
                      Accepted formats: PDF, DOC, DOCX
                    </div>
                  </div>
                </div>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                disabled={isSubmitting}
                className="h-11 rounded-none border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#000] dark:hover:shadow-[6px_6px_0_0_#fff] hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black font-black uppercase tracking-widest"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !isLoaded}
                className={`h-11 rounded-none border-2 border-black dark:border-white text-white font-black uppercase tracking-widest text-xs min-[375px]:text-sm whitespace-normal px-2 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#000] dark:hover:shadow-[6px_6px_0_0_#fff] ${
                  isEmployer ? "bg-[#AB47BC]" : "bg-[#2563EB]"
                }`}
              >
                {isSubmitting ? "Saving..." : "Create Account"}
              </Button>
            </div>
          </form>
        )}

        {/* ── Employer Profile ── */}
        {isEmployer && (
          <form
            onSubmit={employerForm.handleSubmit(onEmployerSubmit)}
            className="space-y-5"
            noValidate
          >
            <div className="grid gap-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                placeholder="e.g., TechCorp Inc."
                className="rounded-none border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] px-3 py-2 text-sm focus-visible:ring-offset-0 focus-visible:ring-0 focus-visible:border-black dark:focus-visible:border-white"
                {...employerForm.register("companyName")}
                aria-invalid={!!employerForm.formState.errors.companyName}
              />
              {employerForm.formState.errors.companyName && (
                <Typography variant="p" className="text-xs text-red-500">
                  {employerForm.formState.errors.companyName.message}
                </Typography>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="position">Your Role / Position</Label>
              <Input
                id="position"
                placeholder="e.g., HR Manager, Tech Lead, CEO..."
                className="rounded-none border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] px-3 py-2 text-sm focus-visible:ring-offset-0 focus-visible:ring-0 focus-visible:border-black dark:focus-visible:border-white"
                {...employerForm.register("position")}
                aria-invalid={!!employerForm.formState.errors.position}
              />
              {employerForm.formState.errors.position && (
                <Typography variant="p" className="text-xs text-red-500">
                  {employerForm.formState.errors.position.message}
                </Typography>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Rank / Level</Label>
              <Select
                value={employerForm.watch("rankLevel")}
                onValueChange={(v) =>
                  employerForm.setValue(
                    "rankLevel",
                    v as EmployerProfileData["rankLevel"],
                    {
                      shouldValidate: true,
                    },
                  )
                }
              >
                <SelectTrigger className="h-11 rounded-none border-2 border-black dark:border-white transition-all shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] bg-white cursor-pointer hover:-translate-y-px hover:-translate-x-px hover:shadow-[4px_4px_0_0_#000] dark:hover:shadow-[4px_4px_0_0_#fff] dark:bg-black font-bold focus:ring-0">
                  <SelectValue placeholder="Select your level..." />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-black z-50 rounded-none border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff]">
                  <SelectItem
                    value="mid"
                    className="cursor-pointer focus:bg-slate-100 dark:focus:bg-gray-700"
                  >
                    Mid
                  </SelectItem>
                  <SelectItem
                    value="senior"
                    className="cursor-pointer focus:bg-slate-100 dark:focus:bg-gray-700"
                  >
                    Senior
                  </SelectItem>
                  <SelectItem
                    value="lead"
                    className="cursor-pointer focus:bg-slate-100 dark:focus:bg-gray-700"
                  >
                    Lead
                  </SelectItem>
                  <SelectItem
                    value="manager"
                    className="cursor-pointer focus:bg-slate-100 dark:focus:bg-gray-700"
                  >
                    Manager
                  </SelectItem>
                  <SelectItem
                    value="director"
                    className="cursor-pointer focus:bg-slate-100 dark:focus:bg-gray-700"
                  >
                    Director
                  </SelectItem>
                  <SelectItem
                    value="executive"
                    className="cursor-pointer focus:bg-slate-100 dark:focus:bg-gray-700"
                  >
                    Executive
                  </SelectItem>
                </SelectContent>
              </Select>
              {employerForm.formState.errors.rankLevel && (
                <Typography variant="p" className="text-xs text-red-500">
                  {employerForm.formState.errors.rankLevel.message}
                </Typography>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                disabled={isSubmitting}
                className="h-11 rounded-none border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#000] dark:hover:shadow-[6px_6px_0_0_#fff] hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black font-black uppercase tracking-widest"
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !isLoaded}
                className={`h-11 rounded-none border-2 border-black dark:border-white text-white font-black uppercase tracking-widest text-xs min-[375px]:text-sm whitespace-normal px-2 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#000] dark:hover:shadow-[6px_6px_0_0_#fff] ${
                  isEmployer ? "bg-[#AB47BC]" : "bg-[#2563EB]"
                }`}
              >
                {isSubmitting ? "Saving..." : "Create Account"}
              </Button>
            </div>
          </form>
        )}

        <Separator />

        <div className="flex flex-col items-center gap-2">
          <Typography
            variant="caption"
            color="muted"
            className="block text-center"
          >
            Signed in as{" "}
            <Typography variant="span" weight="medium">
              {user?.primaryEmailAddress?.emailAddress}
            </Typography>
          </Typography>
          <button
            type="button"
            onClick={() => signOut({ redirectUrl: "/login" })}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-red-600 dark:hover:text-red-400"
          >
            <LogOut className="h-3 w-3" />
            Sign out
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
