// app/(auth)/signup/page.tsx
"use client";

import { Building2, GraduationCap, Upload, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth, useSignUp } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useMutation } from "convex/react";
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

import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { PasswordInput } from "@/components/ui/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "../../../../convex/_generated/api";

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
  firstName: z.string().min(1, "First name is required").trim(),
  lastName: z.string().min(1, "Last name is required").trim(),
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
  const { getToken } = useAuth();
  const { isLoaded, setActive, signUp } = useSignUp();
  const upsertCurrentUser = useMutation(api.users.upsertCurrentUser);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialRoleFromQuery = searchParams.get("role");
  const initialRole: Role | null =
    initialRoleFromQuery === "student" || initialRoleFromQuery === "employer"
      ? initialRoleFromQuery
      : null;

  const [step, setStep] = useState<Step>(initialRole ? 1 : 0);
  const [role, setRole] = useState<Role | null>(initialRole);
  const [step1Data, setStep1Data] = useState<Step1Data | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [pendingSignupPayload, setPendingSignupPayload] =
    useState<PendingSignupPayload | null>(null);

  // CV file (student only, optional)
  const [cvFile, setCvFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isEmployer = role === "employer";

  const theme = useMemo(() => {
    if (isEmployer) {
      return {
        accentText: "text-purple-600",
        primaryBtn: "bg-purple-600 hover:bg-purple-700",
        softBg: "bg-purple-50/50",
        dashHover: "hover:border-purple-500",
        iconBg: "bg-purple-100",
        iconText: "text-purple-600",
      };
    }
    return {
      accentText: "text-blue-600",
      primaryBtn: "bg-blue-600 hover:bg-blue-700",
      softBg: "bg-blue-50/50",
      dashHover: "hover:border-blue-500",
      iconBg: "bg-blue-100",
      iconText: "text-blue-600",
    };
  }, [isEmployer]);

  const totalSteps = step === 3 ? 3 : 2;
  const progressValue =
    step === 1
      ? totalSteps === 3
        ? 33
        : 50
      : step === 2
        ? totalSteps === 3
          ? 67
          : 100
        : step === 3
          ? 100
          : 0;

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

  function handleRateLimitError(error: { status: number; retryAfter?: number }) {
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

  async function waitForConvexToken(timeoutMs = 5000) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const token = await getToken({ template: "convex", skipCache: true });
      if (token) {
        return token;
      }
      await sleep(250);
    }
    return null;
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
    const token = await waitForConvexToken();
    if (!token) {
      throw new Error(
        "Missing Convex auth token. In Clerk, create JWT template named 'convex' with audience 'convex'.",
      );
    }

    let lastError: unknown = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
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
        await sleep(300 * (attempt + 1));
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

      if (signUpAttempt.status === "complete" && signUpAttempt.createdSessionId) {
        await setActive?.({ session: signUpAttempt.createdSessionId });
        await persistProfileWithRetry(payload);
        router.push("/");
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
        error.message.includes("Unauthorized")
      ) {
        setSubmitError(
          "Signed in, but Convex auth failed. Check Clerk JWT template name 'convex' and audience 'convex'.",
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
        setSubmitError("Verification is incomplete. Please try the code again.");
        return;
      }

      await setActive?.({ session: verificationAttempt.createdSessionId });
      await persistProfileWithRetry(pendingSignupPayload);
      router.push("/");
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
        error.message.includes("Unauthorized")
      ) {
        setSubmitError(
          "Email verified, but Convex auth failed. Check Clerk JWT template name 'convex' and audience 'convex'.",
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
      <Card className="rounded-3xl border shadow-sm">
        <CardHeader className="text-center space-y-2 px-4 sm:px-8 pt-8">
          <CardTitle className="text-2xl">Join Internify</CardTitle>
          <CardDescription>
            Choose how you want to use the platform
          </CardDescription>
        </CardHeader>

        <CardContent className="px-4 sm:px-8 pb-6 space-y-4">
          <button
            type="button"
            onClick={() => selectRole("student")}
            aria-label="Sign up as a student"
            className="group w-full flex items-start gap-4 p-5 border rounded-2xl text-left transition-all
                       hover:shadow-sm hover:-translate-y-px
                       hover:border-blue-500 hover:bg-blue-50/50"
          >
            <div className="p-3 rounded-xl bg-blue-100 text-blue-600 transition-colors group-hover:bg-blue-600 group-hover:text-white">
              <User className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="font-semibold">I&apos;m a Student</div>
              <div className="text-sm text-muted-foreground">
                Solve tasks, build your portfolio, and earn certificates.
              </div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => selectRole("employer")}
            aria-label="Sign up as an employer"
            className="group w-full flex items-start gap-4 p-5 border rounded-2xl text-left transition-all
                       hover:shadow-sm hover:-translate-y-px
                       hover:border-purple-500 hover:bg-purple-50/50"
          >
            <div className="p-3 rounded-xl bg-purple-100 text-purple-600 transition-colors group-hover:bg-purple-600 group-hover:text-white">
              <Building2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <div className="font-semibold">I&apos;m an Employer</div>
              <div className="text-sm text-muted-foreground">
                Post challenges and evaluate junior talent with AI.
              </div>
            </div>
          </button>
        </CardContent>

        <CardFooter className="justify-center pb-8">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href={loginHref}
              className="font-semibold text-primary hover:underline"
            >
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    );
  }

  // ── Steps 1 & 2 ──

  const loginHref = role ? `/login?role=${role}` : "/login";

  return (
    <Card className="rounded-3xl border shadow-sm">
      <CardHeader className="px-4 sm:px-8 pt-8">
        <div className="flex items-center justify-between text-sm">
          <Badge variant="secondary" className="capitalize font-normal text-sm">
            {role}
          </Badge>
          <span className="text-muted-foreground">
            Step {step} of {totalSteps}
          </span>
        </div>

        <Progress value={progressValue} className="h-2" />

        <div className="text-center space-y-1">
          <CardTitle className="text-2xl">
            {step === 1
              ? "Create your account"
              : step === 2
                ? "Complete your profile"
                : "Verify your email"}
          </CardTitle>
          <CardDescription>
            {step === 1
              ? "Enter your basic account details"
              : step === 2
                ? "Tell us more about yourself"
                : "Enter the verification code sent to your email"}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="px-4 sm:px-8 pb-8 space-y-6">
        {submitError && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {submitError}
          </p>
        )}
        {/* ── Step 1: Credentials ── */}
        {step === 1 && (
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
                  {...step1Form.register("firstName")}
                />
                <p className="text-xs text-red-500 min-h-4">
                  {step1Form.formState.errors.firstName?.message ?? ""}
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  {...step1Form.register("lastName")}
                />
                <p className="text-xs text-red-500 min-h-4">
                  {step1Form.formState.errors.lastName?.message ?? ""}
                </p>
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
              {step1Form.formState.errors.email && (
                <p className="text-xs text-red-500">
                  {step1Form.formState.errors.email.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                placeholder="••••••••"
                {...step1Form.register("password")}
                aria-invalid={!!step1Form.formState.errors.password}
              />
              {step1Form.formState.errors.password ? (
                <p className="text-xs text-red-500">
                  {step1Form.formState.errors.password.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Min 8 characters, one uppercase, one lowercase, one number
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 min-[375px]:grid-cols-2 gap-3 pt-2">
              <Button type="button" variant="outline" onClick={goBack}>
                Back
              </Button>
              <Button
                type="submit"
                className={`text-white font-semibold text-xs min-[375px]:text-sm whitespace-normal ${theme.primaryBtn}`}
              >
                Continue
              </Button>
            </div>

            <p className="text-sm text-muted-foreground text-center pt-2">
              Already have an account?{" "}
              <Link
                href={loginHref}
                className="font-semibold text-primary hover:underline"
              >
                Log in
              </Link>
            </p>
          </form>
        )}

        {/* ── Step 2: Student Profile ── */}
        {step === 2 && !isEmployer && (
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
                className="grid w-full grid-cols-1 min-[375px]:grid-cols-2 gap-3"
              >
                <ToggleGroupItem
                  value="undergraduate"
                  className="w-full min-w-0 h-12 rounded-xl border justify-center px-2 min-[375px]:px-3 text-xs min-[375px]:text-sm data-[state=on]:border-blue-600 data-[state=on]:bg-blue-50"
                >
                  <GraduationCap className="mr-1 min-[375px]:mr-2 h-4 w-4 shrink-0" />
                  Undergraduate
                </ToggleGroupItem>

                <ToggleGroupItem
                  value="graduate"
                  className="w-full min-w-0 h-12 rounded-xl border justify-center px-2 min-[375px]:px-3 text-xs min-[375px]:text-sm data-[state=on]:border-blue-600 data-[state=on]:bg-blue-50"
                >
                  <GraduationCap className="mr-1 min-[375px]:mr-2 h-4 w-4 shrink-0" />
                  Graduate
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="field">Speciality / Field of Study</Label>
              <Input
                id="field"
                placeholder="e.g., Computer Science, Business, Design..."
                {...studentStep2Form.register("fieldOfStudy")}
                aria-invalid={!!studentStep2Form.formState.errors.fieldOfStudy}
              />
              {studentStep2Form.formState.errors.fieldOfStudy && (
                <p className="text-xs text-red-500">
                  {studentStep2Form.formState.errors.fieldOfStudy.message}
                </p>
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
                className={`w-full rounded-xl border border-dashed p-4 text-left transition-all
                            hover:shadow-sm ${theme.softBg} ${theme.dashHover}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${theme.iconBg} ${theme.iconText}`}
                  >
                    <Upload className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">
                      {cvFile ? cvFile.name : "Click to upload your CV"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Accepted formats: PDF, DOC, DOCX
                    </div>
                  </div>
                </div>
              </button>
            </div>

            <div
              id="clerk-captcha"
              className="clerk-captcha-slot"
              data-cl-theme="auto"
              data-cl-size="flexible"
            />

            <div className="grid grid-cols-1 min-[450px]:grid-cols-2 gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !isLoaded}
                className={`text-white font-semibold text-sm whitespace-normal ${theme.primaryBtn}`}
              >
                {isSubmitting ? "Creating account..." : "Complete Registration"}
              </Button>
            </div>

            <Separator />

            <p className="text-xs text-center text-muted-foreground">
              By creating an account, you agree to our{" "}
              <Link href="#" className="underline hover:text-primary">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className="underline hover:text-primary">
                Privacy Policy
              </Link>
              .
            </p>
          </form>
        )}

        {/* ── Step 2: Employer Profile ── */}
        {step === 2 && isEmployer && (
          <form
            onSubmit={employerStep2Form.handleSubmit(onEmployerStep2Submit)}
            className="space-y-5"
            noValidate
          >
            <div className="grid gap-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                placeholder="e.g., TechCorp Inc."
                {...employerStep2Form.register("companyName")}
                aria-invalid={!!employerStep2Form.formState.errors.companyName}
              />
              {employerStep2Form.formState.errors.companyName && (
                <p className="text-xs text-red-500">
                  {employerStep2Form.formState.errors.companyName.message}
                </p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="position">Your Role / Position</Label>
              <Input
                id="position"
                placeholder="e.g., HR Manager, Tech Lead, CEO..."
                {...employerStep2Form.register("position")}
                aria-invalid={!!employerStep2Form.formState.errors.position}
              />
              {employerStep2Form.formState.errors.position && (
                <p className="text-xs text-red-500">
                  {employerStep2Form.formState.errors.position.message}
                </p>
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
                <SelectTrigger className="h-11 rounded-lg bg-white cursor-pointer transition-colors hover:bg-slate-50">
                  <SelectValue placeholder="Select your level..." />
                </SelectTrigger>
                <SelectContent className="bg-white z-50 shadow-lg border-gray-200">
                  <SelectItem
                    value="mid"
                    className="cursor-pointer focus:bg-slate-100"
                  >
                    Mid
                  </SelectItem>
                  <SelectItem
                    value="senior"
                    className="cursor-pointer focus:bg-slate-100"
                  >
                    Senior
                  </SelectItem>
                  <SelectItem
                    value="lead"
                    className="cursor-pointer focus:bg-slate-100"
                  >
                    Lead
                  </SelectItem>
                  <SelectItem
                    value="manager"
                    className="cursor-pointer focus:bg-slate-100"
                  >
                    Manager
                  </SelectItem>
                  <SelectItem
                    value="director"
                    className="cursor-pointer focus:bg-slate-100"
                  >
                    Director
                  </SelectItem>
                  <SelectItem
                    value="executive"
                    className="cursor-pointer focus:bg-slate-100"
                  >
                    Executive
                  </SelectItem>
                </SelectContent>
              </Select>
              {employerStep2Form.formState.errors.rankLevel && (
                <p className="text-xs text-red-500">
                  {employerStep2Form.formState.errors.rankLevel.message}
                </p>
              )}
            </div>

            <div
              id="clerk-captcha"
              className="clerk-captcha-slot"
              data-cl-theme="auto"
              data-cl-size="flexible"
            />

            <div className="grid grid-cols-1 min-[450px]:grid-cols-2 gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !isLoaded}
                className={`text-white font-semibold text-sm whitespace-normal ${theme.primaryBtn}`}
              >
                {isSubmitting ? "Creating account..." : "Complete Registration"}
              </Button>
            </div>

            <Separator />

            <p className="text-xs text-center text-muted-foreground">
              By creating an account, you agree to our{" "}
              <Link href="#" className="underline hover:text-primary">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="#" className="underline hover:text-primary">
                Privacy Policy
              </Link>
              .
            </p>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={onVerifyEmailCodeSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="email-code">Email verification code</Label>
              <Input
                id="email-code"
                value={verificationCode}
                onChange={(event) => setVerificationCode(event.target.value)}
                placeholder="Enter the code from your email"
                autoComplete="one-time-code"
              />
              <p className="text-xs text-muted-foreground">
                We sent a one-time code to <strong>{step1Data?.email}</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 min-[450px]:grid-cols-2 gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={goBack}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || verificationCode.trim().length === 0}
                className={`text-white font-semibold text-sm whitespace-normal ${theme.primaryBtn}`}
              >
                {isSubmitting ? "Verifying..." : "Verify and Continue"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
