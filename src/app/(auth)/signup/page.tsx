// app/(auth)/signup/page.tsx
"use client";

import { Building2, GraduationCap, Upload, User } from "lucide-react";
import Link from "next/link";
import Stepper, { Step } from "@/components/Stepper";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Typography } from "@/components/ui/Typography";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSignUp, useUser } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useConvex, useMutation, useQuery } from "convex/react";
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
  CardTitle,
} from "@/components/ui/card";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { PasswordInput } from "@/components/ui/password-input";
import { PasswordRequirements } from "@/components/ui/password-requirements";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "../../../../convex/_generated/api";
import {
  MAX_USER_NAME_FIELD_LENGTH,
  validateSingleNameField,
} from "../../../../convex/nameLimits";
import {
  useConvexTokenReady,
} from "@/lib/convexAuth";

// ── Schemas ──────────────────────────────────────────────

type Role = "student" | "employer";
type Step = 0 | 1 | 2 | 3;
type AcademicStatus = "undergraduate" | "graduate";

type PendingSignupPayload =
  | {
      role: "student";
      step1: Step1Data;
      profile: StudentStep2Data;
      cvFileName: string | null;
    }
  | {
      role: "employer";
      step1: Step1Data;
      profile: EmployerStep2Data;
    };

const step1Schema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, "First name is required")
    .superRefine((val, ctx) => {
      const err = validateSingleNameField(val, "First name");
      if (err)
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: err });
    }),
  lastName: z
    .string()
    .trim()
    .min(1, "Last name is required")
    .superRefine((val, ctx) => {
      const err = validateSingleNameField(val, "Last name");
      if (err)
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: err });
    }),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
});

const studentStep2Schema = z.object({
  academicStatus: z.enum(["undergraduate", "graduate"]),
  fieldOfStudy: z.string().min(1, "Field of study is required").trim(),
});

const employerStep2Schema = z.object({
  companyName: z.string().min(1, "Company name is required").trim(),
  position: z.string().min(1, "Position is required").trim(),
  rankLevel: z.enum(
    ["mid", "senior", "lead", "manager", "director", "executive"],
    {
      message: "Please select your level",
    },
  ),
});

type Step1Data = z.infer<typeof step1Schema>;
type StudentStep2Data = z.infer<typeof studentStep2Schema>;
type EmployerStep2Data = z.infer<typeof employerStep2Schema>;

// ── Component ────────────────────────────────────────────

export default function SignUpPage() {
  const { isLoaded, setActive, signUp } = useSignUp();
  const { isLoaded: isUserLoaded, isSignedIn } = useUser();
  const convex = useConvex();
  const upsertCurrentUser = useMutation(api.users.upsertCurrentUser);
  const isConvexTokenReady = useConvexTokenReady();
  const currentUser = useQuery(
    api.users.currentUser,
    isConvexTokenReady ? {} : "skip",
  );
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>(0);
  const [role, setRole] = useState<Role | null>(null);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingSignupPayload, setPendingSignupPayload] =
    useState<PendingSignupPayload | null>(null);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // CV file (student only, optional)
  const [cvFile, setCvFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isEmployer = role === "employer";

  const theme = useMemo(() => {
    if (isEmployer) {
      return {
        accentText: "text-purple-600 dark:text-purple-400",
        primaryBtn: "bg-purple-600 hover:bg-purple-700",
        softBg: "bg-purple-50/50 dark:bg-purple-950/30",
        dashHover: "hover:border-purple-500",
        iconBg: "bg-purple-100 dark:bg-purple-900",
        iconText: "text-purple-600 dark:text-purple-400",
      };
    }
    return {
      accentText: "text-blue-600 dark:text-blue-400",
      primaryBtn: "bg-blue-600 hover:bg-blue-700",
      softBg: "bg-blue-50/50 dark:bg-blue-950/30",
      dashHover: "hover:border-blue-600",
      iconBg: "bg-blue-100 dark:bg-blue-900",
      iconText: "text-blue-600 dark:text-blue-400",
    };
  }, [isEmployer]);

  const totalSteps = step === 3 ? 3 : 2;

  // ── Step 1 form ──

  const step1Form = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    mode: "onTouched",
    defaultValues: step1Data ?? {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });

  // ── Step 2 forms ──

  const studentStep2Form = useForm<StudentStep2Data>({
    resolver: zodResolver(studentStep2Schema),
    mode: "onTouched",
    defaultValues: { academicStatus: "undergraduate", fieldOfStudy: "" },
  });

  const employerStep2Form = useForm<EmployerStep2Data>({
    resolver: zodResolver(employerStep2Schema),
    mode: "onTouched",
    defaultValues: { companyName: "", position: "" },
  });

  // ── Already-signed-in guard ──
  useEffect(() => {
    if (!isUserLoaded || !isSignedIn) return;
    if (!isConvexTokenReady || currentUser === undefined) return;
    if (currentUser?.user?.role) {
      router.replace("/dashboard");
    } else {
      router.replace("/complete-profile");
    }
  }, [isUserLoaded, isSignedIn, isConvexTokenReady, currentUser, router]);

  // Show spinner while Clerk is loading OR if already signed in (redirect pending)
  if (!isUserLoaded || isSignedIn) {
    return (
      <div className="flex min-h-[300px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // ── Helpers ──

  function syncRoleQuery(nextRole: Role | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextRole) {
      params.set("role", nextRole);
    } else {
      params.delete("role");
    }
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }

  function selectRole(r: Role) {
    setRole(r);
    setStep(1);
    setSubmitError(null);
    syncRoleQuery(r);
  }

  function goBack() {
    setSubmitError(null);

    if (step === 3) {
      setStep(2);
      return;
    }

    if (step === 2) return setStep(1);
    if (step === 1) {
      setStep(0);
      setRole(null);
      setStep1Data(null);
      syncRoleQuery(null);
    }
  }

  function onStep1Submit(data: Step1Data) {
    setSubmitError(null);
    setStep1Data(data);
    setStep(2);
  }

  function handleRateLimitError(error: {
    status: number;
    retryAfter?: number;
  }) {
    if (error.status !== 429) {
      return false;
    }

    const retryAfter = Math.max(1, Math.ceil(error.retryAfter ?? 10));
    setSubmitError(
      `Too many requests. Please wait ${retryAfter} seconds and try again.`,
    );

    setTimeout(() => {
      setSubmitError((current) =>
        current?.toLowerCase().includes("too many requests") ? null : current,
      );
    }, retryAfter * 1000);

    return true;
  }

  async function sleep(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function waitForConvexSession() {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      try {
        await convex.query(api.users.requireCurrentIdentity, {});
        return true;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : String(error ?? "");

        if (!message.includes("Unauthorized")) {
          throw error;
        }
      }

      await sleep(250);
    }

    return false;
  }

  async function persistProfile(payload: PendingSignupPayload) {
    if (payload.role === "student") {
      await upsertCurrentUser({
        role: "student",
        firstName: payload.step1.firstName,
        lastName: payload.step1.lastName,
        email: payload.step1.email,
        studentProfile: {
          academicStatus: payload.profile.academicStatus,
          fieldOfStudy: payload.profile.fieldOfStudy,
          cvFileName: payload.cvFileName ?? undefined,
        },
      });
      return;
    }

    await upsertCurrentUser({
      role: "employer",
      firstName: payload.step1.firstName,
      lastName: payload.step1.lastName,
      email: payload.step1.email,
      employerProfile: {
        companyName: payload.profile.companyName,
        position: payload.profile.position,
        rankLevel: payload.profile.rankLevel,
      },
    });
  }

  async function persistProfileWithRetry(payload: PendingSignupPayload) {
    let lastError: unknown = null;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        await persistProfile(payload);
        return;
      } catch (error) {
        lastError = error;
        const message =
          error instanceof Error ? error.message : String(error ?? "");
        if (!message.includes("Unauthorized")) {
          throw error;
        }
        await sleep(250);
      }
    }

    throw lastError;
  }

  async function createAccountAndPersist(payload: PendingSignupPayload) {
    if (!isLoaded || !signUp) {
      setSubmitError("Authentication is still loading. Please try again.");
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const signUpAttempt = await signUp.create({
        emailAddress: payload.step1.email,
        password: payload.step1.password,
        firstName: payload.step1.firstName,
        lastName: payload.step1.lastName,
      });

      if (
        signUpAttempt.status === "complete" &&
        signUpAttempt.createdSessionId
      ) {
        await setActive?.({ session: signUpAttempt.createdSessionId });
        const hasConvexSession = await waitForConvexSession();
        if (!hasConvexSession) {
          setSubmitError(
            "Clerk created the account, but Convex still could not verify this browser session. Please refresh and try again.",
          );
          return;
        }
        await persistProfileWithRetry(payload);
        router.push("/dashboard");
        return;
      }

      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingSignupPayload(payload);
      setVerificationCode("");
      setStep(3);
    } catch (error) {
      if (isClerkAPIResponseError(error)) {
        if (handleRateLimitError(error)) {
          return;
        }

        setSubmitError(
          error.errors[0]?.longMessage ??
            error.errors[0]?.message ??
            "Could not create your account.",
        );
      } else if (
        error instanceof Error &&
        (error.message.includes("Unauthorized") ||
          error.message.includes("Convex session unavailable"))
      ) {
        setSubmitError(
          "Clerk created the account, but Convex still could not verify this browser session. Please refresh and try again.",
        );
      } else if (error instanceof Error && error.message.includes("convex")) {
        setSubmitError(error.message);
      } else {
        setSubmitError("Could not create your account.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  async function onStudentStep2Submit(data: StudentStep2Data) {
    if (!step1Data) {
      setSubmitError("Please complete the first step first.");
      setStep(1);
      return;
    }

    await createAccountAndPersist({
      role: "student",
      step1: step1Data,
      profile: data,
      cvFileName: cvFile?.name ?? null,
    });
  }

  async function onEmployerStep2Submit(data: EmployerStep2Data) {
    if (!step1Data) {
      setSubmitError("Please complete the first step first.");
      setStep(1);
      return;
    }

    await createAccountAndPersist({
      role: "employer",
      step1: step1Data,
      profile: data,
    });
  }

  async function onVerifyEmailCodeSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!isLoaded || !signUp) {
      setSubmitError("Authentication is still loading. Please try again.");
      return;
    }

    if (!pendingSignupPayload) {
      setSubmitError("Missing signup data. Please complete signup again.");
      setStep(1);
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const verificationAttempt = await signUp.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });

      if (
        verificationAttempt.status !== "complete" ||
        !verificationAttempt.createdSessionId
      ) {
        setSubmitError(
          "Verification is incomplete. Please try the code again.",
        );
        return;
      }

      await setActive?.({ session: verificationAttempt.createdSessionId });
      const hasConvexSession = await waitForConvexSession();
      if (!hasConvexSession) {
        setSubmitError(
          "Your email was verified, but Convex still could not verify this browser session. Please refresh and try again.",
        );
        return;
      }
      await persistProfileWithRetry(pendingSignupPayload);
      router.push("/dashboard");
    } catch (error) {
      if (isClerkAPIResponseError(error)) {
        if (handleRateLimitError(error)) {
          return;
        }

        setSubmitError(
          error.errors[0]?.longMessage ??
            error.errors[0]?.message ??
            "Invalid verification code.",
        );
      } else if (
        error instanceof Error &&
        (error.message.includes("Unauthorized") ||
          error.message.includes("Convex session unavailable"))
      ) {
        setSubmitError(
          "Your email was verified, but Convex still could not verify this browser session. Please refresh and try again.",
        );
      } else if (error instanceof Error && error.message.includes("convex")) {
        setSubmitError(error.message);
      } else {
        setSubmitError("Invalid verification code.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  function pickFile() {
    fileInputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSubmitError(null);
    setCvFile(e.target.files?.[0] ?? null);
  }

  // ── Step 0: Role picker ──

  if (step === 0 || !role) {
    const loginHref = role ? `/login?role=${role}` : "/login";

    return (
      <Card className="rounded-none border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff]">
        <CardHeader className="text-center space-y-2 px-4 sm:px-8 pt-8 rounded-none border-b-4 border-black dark:border-white pb-6 mb-6">
          <Typography
            variant="h2"
            className="text-2xl uppercase tracking-widest font-black text-center"
          >
            Join Internify
          </Typography>
          <CardDescription className="text-black dark:text-white font-bold uppercase tracking-widest text-xs">
            Choose how you want to use the platform
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4 sm:px-8 pb-6 space-y-4">
          <button
            type="button"
            onClick={() => selectRole("student")}
            aria-label="Sign up as a student"
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
              <Typography
                variant="span"
                className="block text-white font-bold text-sm"
              >
                Solve tasks, build your portfolio, and earn certificates.
              </Typography>
            </div>
          </button>

          <button
            type="button"
            onClick={() => selectRole("employer")}
            aria-label="Sign up as an employer"
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
              <Typography
                variant="span"
                className="block text-white font-bold text-sm"
              >
                Post challenges and evaluate junior talent with AI.
              </Typography>
            </div>
          </button>
        </CardContent>

        <CardFooter className="justify-center pb-8">
          <Typography variant="span" color="muted" className="text-sm">
            Already have an account?{" "}
            <Link
              href={loginHref}
              className="font-semibold text-primary hover:underline"
            >
              Log in
            </Link>
          </Typography>
        </CardFooter>
      </Card>
    );
  }

  // ── Steps 1 & 2 ──

  const loginHref = role ? `/login?role=${role}` : "/login";

  return (
    <Card className="rounded-none border-4 border-black dark:border-white shadow-[8px_8px_0_0_#000] dark:shadow-[8px_8px_0_0_#fff]">
      <CardHeader className="px-4 sm:px-8 pt-8 rounded-none border-b-4 border-black dark:border-white pb-6 mb-6">
        {/* ── Role label ── */}
        <div className="flex justify-center mb-1">
          <span
            className={`inline-flex items-center gap-2 px-4 py-1.5 text-sm font-black uppercase tracking-widest border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] ${
              isEmployer ? "bg-[#AB47BC] text-white" : "bg-[#2563EB] text-white"
            }`}
          >
            {isEmployer ? (
              <Building2 className="h-4 w-4" />
            ) : (
              <User className="h-4 w-4" />
            )}
            {role} Account
          </span>
        </div>
      </CardHeader>

      <CardContent className="px-0 pb-0">
        <Stepper
          currentStep={step}
          footerClassName="hidden"
          stepContainerClassName="w-full max-w-sm mx-auto pb-6 pt-2"
          contentClassName="px-0"
          stepCircleContainerClassName="shadow-none border-none"
          disableStepIndicators
          activeColor={isEmployer ? "purple" : "blue"}
        >
          {/* ── Step 1: Credentials ── */}
          <Step>
            <div className="px-4 sm:px-8 pb-8 space-y-6">
              <div className="text-center space-y-1 mb-6">
                <Typography
                  variant="h2"
                  className="text-2xl uppercase tracking-widest font-black text-center"
                >
                  Create Your Account
                </Typography>
                <CardDescription className="text-black dark:text-white font-bold uppercase tracking-widest text-xs">
                  Enter your basic account details
                </CardDescription>
              </div>
              {submitError && step === 1 && (
                <Typography
                  variant="p"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
                >
                  {submitError}
                </Typography>
              )}
              <form
                onSubmit={step1Form.handleSubmit(onStep1Submit)}
                className="space-y-4"
                noValidate
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      maxLength={MAX_USER_NAME_FIELD_LENGTH}
                      {...step1Form.register("firstName")}
                    />
                    <div className="min-h-5">
                      {step1Form.formState.errors.firstName && (
                        <Typography
                          variant="p"
                          className="text-xs text-red-500"
                        >
                          {step1Form.formState.errors.firstName.message}
                        </Typography>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      maxLength={MAX_USER_NAME_FIELD_LENGTH}
                      {...step1Form.register("lastName")}
                    />
                    <div className="min-h-5">
                      {step1Form.formState.errors.lastName && (
                        <Typography
                          variant="p"
                          className="text-xs text-red-500"
                        >
                          {step1Form.formState.errors.lastName.message}
                        </Typography>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="email">
                    {isEmployer ? "Work Email" : "Email"}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    {...step1Form.register("email")}
                    aria-invalid={!!step1Form.formState.errors.email}
                  />
                  <div className="min-h-5">
                    {step1Form.formState.errors.email && (
                      <Typography variant="p" className="text-xs text-red-500">
                        {step1Form.formState.errors.email.message}
                      </Typography>
                    )}
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <PasswordInput
                    id="password"
                    placeholder="••••••••"
                    {...step1Form.register("password")}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={(e) => {
                      step1Form.register("password").onBlur(e);
                      setPasswordFocused(false);
                    }}
                    aria-invalid={!!step1Form.formState.errors.password}
                  />
                  <PasswordRequirements
                    password={step1Form.watch("password")}
                    isFocused={passwordFocused}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goBack}
                    className="h-11 rounded-none border-2 border-black dark:border-white shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#000] dark:hover:shadow-[6px_6px_0_0_#fff] hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black font-black uppercase tracking-widest"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className={`h-11 rounded-none border-2 border-black dark:border-white text-white font-black uppercase tracking-widest text-xs min-[375px]:text-sm whitespace-normal px-2 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#000] dark:hover:shadow-[6px_6px_0_0_#fff] ${
                      isEmployer ? "bg-[#AB47BC]" : "bg-[#2563EB]"
                    }`}
                  >
                    Continue
                  </Button>
                </div>

                <Typography
                  variant="span"
                  color="muted"
                  className="block text-center pt-2"
                >
                  Already have an account?{" "}
                  <Link
                    href={loginHref}
                    className="font-semibold text-primary hover:underline"
                  >
                    Log in
                  </Link>
                </Typography>
              </form>
            </div>
          </Step>

          {/* ── Step 2: Profile ── */}
          <Step>
            <div className="px-4 sm:px-8 pb-8 space-y-6">
              <div className="text-center space-y-1 mb-6">
                <Typography
                  variant="h2"
                  className="text-2xl uppercase tracking-widest font-black text-center"
                >
                  Complete Your Profile
                </Typography>
                <CardDescription className="text-black dark:text-white font-bold uppercase tracking-widest text-xs">
                  Tell us more about yourself
                </CardDescription>
              </div>
              {submitError && step === 2 && (
                <Typography
                  variant="p"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
                >
                  {submitError}
                </Typography>
              )}
              {!isEmployer ? (
                <form
                  onSubmit={studentStep2Form.handleSubmit(onStudentStep2Submit)}
                  className="space-y-5"
                  noValidate
                >
                  <div className="space-y-2">
                    <Label>Academic Status</Label>
                    <ToggleGroup
                      type="single"
                      value={studentStep2Form.watch("academicStatus")}
                      onValueChange={(v) =>
                        v &&
                        studentStep2Form.setValue(
                          "academicStatus",
                          v as AcademicStatus,
                          { shouldValidate: true },
                        )
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
                      {...studentStep2Form.register("fieldOfStudy")}
                      aria-invalid={
                        !!studentStep2Form.formState.errors.fieldOfStudy
                      }
                    />
                    {studentStep2Form.formState.errors.fieldOfStudy && (
                      <Typography variant="p" className="text-xs text-red-500">
                        {studentStep2Form.formState.errors.fieldOfStudy.message}
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

                  <div
                    id="clerk-captcha"
                    className="clerk-captcha-slot empty:hidden"
                    data-cl-theme="auto"
                    data-cl-size="flexible"
                  />

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
                      className={`h-11 rounded-none border-2 border-black dark:border-white text-white font-black uppercase tracking-widest text-xs min-[375px]:text-sm whitespace-nowrap px-2 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#000] dark:hover:shadow-[6px_6px_0_0_#fff] bg-[#2563EB]`}
                    >
                      {isSubmitting ? "Creating account..." : "Create Account"}
                    </Button>
                  </div>

                  <Separator />

                  <Typography
                    variant="caption"
                    color="muted"
                    className="block text-center"
                  >
                    By creating an account, you agree to our{" "}
                    <Link href="#" className="underline hover:text-primary">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="#" className="underline hover:text-primary">
                      Privacy Policy
                    </Link>
                    .
                  </Typography>
                </form>
              ) : (
                <form
                  onSubmit={employerStep2Form.handleSubmit(
                    onEmployerStep2Submit,
                  )}
                  className="space-y-5"
                  noValidate
                >
                  <div className="grid gap-2">
                    <Label htmlFor="company">Company Name</Label>
                    <Input
                      id="company"
                      placeholder="e.g., TechCorp Inc."
                      className="rounded-none border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] px-3 py-2 text-sm focus-visible:ring-offset-0 focus-visible:ring-0 focus-visible:border-black dark:focus-visible:border-white"
                      {...employerStep2Form.register("companyName")}
                      aria-invalid={
                        !!employerStep2Form.formState.errors.companyName
                      }
                    />
                    {employerStep2Form.formState.errors.companyName && (
                      <Typography variant="p" className="text-xs text-red-500">
                        {employerStep2Form.formState.errors.companyName.message}
                      </Typography>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="position">Your Role / Position</Label>
                    <Input
                      id="position"
                      placeholder="e.g., HR Manager, Tech Lead, CEO..."
                      className="rounded-none border-2 border-black dark:border-white shadow-[2px_2px_0_0_#000] dark:shadow-[2px_2px_0_0_#fff] px-3 py-2 text-sm focus-visible:ring-offset-0 focus-visible:ring-0 focus-visible:border-black dark:focus-visible:border-white"
                      {...employerStep2Form.register("position")}
                      aria-invalid={
                        !!employerStep2Form.formState.errors.position
                      }
                    />
                    {employerStep2Form.formState.errors.position && (
                      <Typography variant="p" className="text-xs text-red-500">
                        {employerStep2Form.formState.errors.position.message}
                      </Typography>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label>Rank / Level</Label>
                    <Select
                      value={employerStep2Form.watch("rankLevel")}
                      onValueChange={(v) =>
                        employerStep2Form.setValue(
                          "rankLevel",
                          v as EmployerStep2Data["rankLevel"],
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
                    {employerStep2Form.formState.errors.rankLevel && (
                      <Typography variant="p" className="text-xs text-red-500">
                        {employerStep2Form.formState.errors.rankLevel.message}
                      </Typography>
                    )}
                  </div>

                  <div
                    id="clerk-captcha"
                    className="clerk-captcha-slot empty:hidden"
                    data-cl-theme="auto"
                    data-cl-size="flexible"
                  />

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
                      className={`h-11 rounded-none border-2 border-black dark:border-white text-white font-black uppercase tracking-widest text-xs min-[375px]:text-sm whitespace-nowrap px-2 shadow-[4px_4px_0_0_#000] dark:shadow-[4px_4px_0_0_#fff] transition-all hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[6px_6px_0_0_#000] dark:hover:shadow-[6px_6px_0_0_#fff] bg-[#AB47BC]`}
                    >
                      {isSubmitting ? "Creating account..." : "Create Account"}
                    </Button>
                  </div>

                  <Separator />

                  <Typography
                    variant="caption"
                    color="muted"
                    className="block text-center"
                  >
                    By creating an account, you agree to our{" "}
                    <Link href="#" className="underline hover:text-primary">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="#" className="underline hover:text-primary">
                      Privacy Policy
                    </Link>
                    .
                  </Typography>
                </form>
              )}
            </div>
          </Step>

          {/* ── Step 3: Verification ── */}
          {totalSteps === 3 && (
            <Step>
              <div className="px-4 sm:px-8 pb-8 space-y-6">
                <div className="text-center space-y-1 mb-6">
                  <CardTitle className="text-2xl">Verify your email</CardTitle>
                  <CardDescription>
                    Enter the verification code sent to your email
                  </CardDescription>
                </div>
                {submitError && step === 3 && (
                  <Typography
                    variant="p"
                    className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-800 dark:bg-red-950 dark:text-red-400"
                  >
                    {submitError}
                  </Typography>
                )}
                <form
                  onSubmit={onVerifyEmailCodeSubmit}
                  className="space-y-5"
                  noValidate
                >
                  <div className="space-y-2">
                    <Label htmlFor="email-code">Email verification code</Label>
                    <Input
                      id="email-code"
                      value={verificationCode}
                      onChange={(event) =>
                        setVerificationCode(event.target.value)
                      }
                      placeholder="Enter the code from your email"
                      autoComplete="one-time-code"
                    />
                    <Typography
                      variant="p"
                      className="text-xs text-muted-foreground"
                    >
                      We sent a one-time code to{" "}
                      <strong>{step1Data?.email}</strong>.
                    </Typography>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={goBack}
                      disabled={isSubmitting}
                      className="hover:bg-zinc-100 transition-colors dark:hover:bg-gray-800"
                    >
                      Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        isSubmitting || verificationCode.trim().length === 0
                      }
                      className={`text-white font-semibold text-sm whitespace-nowrap ${theme.primaryBtn}`}
                    >
                      {isSubmitting ? "Verifying..." : "Verify"}
                    </Button>
                  </div>
                </form>
              </div>
            </Step>
          )}
        </Stepper>
      </CardContent>
    </Card>
  );
}
