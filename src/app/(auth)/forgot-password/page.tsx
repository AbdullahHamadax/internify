"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useClerk, useSignIn } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { KeyRound, Mail, ArrowLeft, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// ── Schemas ───────────────────────────────────────────────

const emailSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
});

const resetSchema = z
  .object({
    code: z
      .string()
      .min(1, "Verification code is required")
      .length(6, "Code must be exactly 6 digits"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type EmailFormData = z.infer<typeof emailSchema>;
type ResetFormData = z.infer<typeof resetSchema>;

// ── Component ─────────────────────────────────────────────

export default function ForgotPasswordPage() {
  const { isLoaded, signIn } = useSignIn();
  const { signOut } = useClerk();
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") ?? "student";
  const isEmployer = role === "employer";

  const [step, setStep] = useState<"email" | "reset">("email");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ── Step 1 form ──
  const emailForm = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    mode: "onTouched",
    defaultValues: { email: "" },
  });

  // ── Step 2 form ──
  const resetForm = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    mode: "onTouched",
    defaultValues: { code: "", password: "", confirmPassword: "" },
  });

  // ── Step 1: Send OTP ──
  async function onEmailSubmit(data: EmailFormData) {
    if (!isLoaded || !signIn) {
      setSubmitError("Authentication is still loading. Please try again.");
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await signIn.create({
        strategy: "reset_password_email_code",
        identifier: data.email,
      });
      setStep("reset");
    } catch (error) {
      if (isClerkAPIResponseError(error)) {
        setSubmitError(
          error.errors[0]?.longMessage ??
            error.errors[0]?.message ??
            "Could not send reset email. Please check the address and try again.",
        );
      } else {
        setSubmitError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Step 2: Verify code + set new password ──
  async function onResetSubmit(data: ResetFormData) {
    if (!isLoaded || !signIn) {
      setSubmitError("Authentication is still loading. Please try again.");
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const result = await signIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: data.code.trim(),
        password: data.password,
      });

      if (result.status === "complete") {
        setSuccessMessage(
          "Password reset successfully! Please sign in with your new password.",
        );
      } else {
        setSubmitError(
          "Password reset incomplete. Please try the code again.",
        );
      }
    } catch (error) {
      if (isClerkAPIResponseError(error)) {
        setSubmitError(
          error.errors[0]?.longMessage ??
            error.errors[0]?.message ??
            "Invalid or expired code. Please try again.",
        );
      } else {
        setSubmitError("Something went wrong. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Step 1 UI ────────────────────────────────────────────

  if (step === "email") {
    return (
      <Card className="rounded-3xl border shadow-sm">
        <CardHeader className="text-center space-y-3 px-8 pt-8">
          <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${isEmployer ? "bg-purple-100" : "bg-blue-100"}`}>
            <Mail className={`h-7 w-7 ${isEmployer ? "text-purple-600" : "text-blue-600"}`} />
          </div>
          <CardTitle className="text-2xl">Forgot password?</CardTitle>
          <CardDescription>
            Enter your email and we&apos;ll send you a reset code.
          </CardDescription>
        </CardHeader>

        <CardContent className="px-8 pb-8 space-y-5">
          <form
            onSubmit={emailForm.handleSubmit(onEmailSubmit)}
            className="space-y-4"
            noValidate
          >
            <div className="grid gap-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                {...emailForm.register("email")}
                aria-invalid={!!emailForm.formState.errors.email}
              />
              {emailForm.formState.errors.email && (
                <p className="text-xs text-red-500">
                  {emailForm.formState.errors.email.message}
                </p>
              )}
            </div>

            {submitError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {submitError}
              </p>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || !isLoaded}
              className={`w-full h-11 text-base font-semibold text-white ${isEmployer ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {isSubmitting ? "Sending..." : "Send reset code"}
            </Button>
          </form>

          <div className="text-center">
            <Link
              href={`/login?role=${role}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ── Step 2 UI ────────────────────────────────────────────

  return (
    <Card className="rounded-3xl border shadow-sm">
      <CardHeader className="text-center space-y-3 px-8 pt-8">
        <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-2xl ${isEmployer ? "bg-purple-100" : "bg-blue-100"}`}>
          <ShieldCheck className={`h-7 w-7 ${isEmployer ? "text-purple-600" : "text-blue-600"}`} />
        </div>
        <CardTitle className="text-2xl">Check your email</CardTitle>
        <CardDescription>
          We sent a 6-digit code to your email. Enter it below along with your
          new password.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-8 pb-8 space-y-5">
        {successMessage ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-full rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 text-center font-medium">
              {successMessage}
            </div>
            <Button
              type="button"
              onClick={() => signOut({ redirectUrl: `/login?role=${role}` })}
              className={`w-full h-11 text-base font-semibold text-white ${isEmployer ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              Back to sign in
            </Button>
          </div>
        ) : (
          <form
            onSubmit={resetForm.handleSubmit(onResetSubmit)}
            className="space-y-4"
            noValidate
          >
            {/* Code */}
            <div className="grid gap-2">
              <Label htmlFor="code">Verification code</Label>
              <Input
                id="code"
                placeholder="123456"
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                className="text-center tracking-[0.4em] text-lg font-semibold"
                {...resetForm.register("code")}
                aria-invalid={!!resetForm.formState.errors.code}
              />
              {resetForm.formState.errors.code && (
                <p className="text-xs text-red-500">
                  {resetForm.formState.errors.code.message}
                </p>
              )}
            </div>

            {/* New password */}
            <div className="grid gap-2">
              <Label htmlFor="password">New password</Label>
              <PasswordInput
                id="password"
                placeholder="••••••••"
                {...resetForm.register("password")}
                aria-invalid={!!resetForm.formState.errors.password}
              />
              {resetForm.formState.errors.password ? (
                <p className="text-xs text-red-500">
                  {resetForm.formState.errors.password.message}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Min 8 characters, one uppercase, one lowercase, one number
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div className="grid gap-2">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <PasswordInput
                id="confirmPassword"
                placeholder="••••••••"
                {...resetForm.register("confirmPassword")}
                aria-invalid={!!resetForm.formState.errors.confirmPassword}
              />
              {resetForm.formState.errors.confirmPassword && (
                <p className="text-xs text-red-500">
                  {resetForm.formState.errors.confirmPassword.message}
                </p>
              )}
            </div>

            {submitError && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {submitError}
              </p>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || !isLoaded}
              className={`w-full h-11 text-base font-semibold text-white ${isEmployer ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {isSubmitting ? "Resetting..." : "Reset password"}
            </Button>
          </form>
        )}

        {!successMessage && (
          <div className="text-center space-y-2">
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setSubmitError(null);
                resetForm.reset();
              }}
              className="text-sm text-muted-foreground hover:text-primary hover:underline"
            >
              Didn&apos;t receive a code? Try again
            </button>
          </div>
        )}

        {!successMessage && (
          <div className="text-center">
            <Link
              href={`/login?role=${role}`}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to sign in
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
