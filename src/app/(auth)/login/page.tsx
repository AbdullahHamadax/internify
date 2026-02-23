"use client";

import { Briefcase, GraduationCap } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";

import { zodResolver } from "@hookform/resolvers/zod";
import { useClerk, useSignIn } from "@clerk/nextjs";
import { isClerkAPIResponseError } from "@clerk/nextjs/errors";
import { useConvex } from "convex/react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PasswordInput } from "@/components/ui/password-input";
import { api } from "../../../../convex/_generated/api";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(8, "Password must be at least 8 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { isLoaded, setActive, signIn } = useSignIn();
  const { signOut } = useClerk();
  const convex = useConvex();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") === "employer" ? "employer" : "student";
  const isEmployer = role === "employer";
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: "onTouched",
    defaultValues: { email: "", password: "" },
  });

  // Catches errors passed in the URL after a forced sign-out
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setSubmitError(errorParam);
      
      const params = new URLSearchParams(searchParams.toString());
      params.delete("error");
      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    }
  }, [searchParams, pathname, router]);

  function handleRoleChange(value: string) {
    if (value !== "student" && value !== "employer") return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("role", value);
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
  }

  async function sleep(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Returns `null` after 8 tries instead of throwing an error.
  async function getSignedInAccountRoleWithRetry() {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      try {
        const currentUser = await convex.query(api.users.currentUser, {});
        
        if (currentUser?.user?.role) {
          return currentUser.user.role;
        }
        
        throw new Error("Unauthorized - Waiting for token sync");
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error ?? "");
        if (!message.includes("Unauthorized")) {
          throw error; // If it's a real database crash, throw it immediately
        }
      }
      await sleep(250);
    }

    // If we tried 8 times and still got nothing, calmly return null.
    return null;
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

  async function onSubmit(data: LoginFormData) {
    if (!isLoaded || !signIn) {
      setSubmitError("Authentication is still loading. Please try again.");
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    // TRACKER: Did they actually make it past the Clerk password check?
    let sessionActivated = false;

    try {
      const signInAttempt = await signIn.create({
        identifier: data.email,
        password: data.password,
      });

      if (
        signInAttempt.status !== "complete" ||
        !signInAttempt.createdSessionId
      ) {
        setSubmitError(
          "Sign in requires an extra verification step in Clerk dashboard.",
        );
        return;
      }

      // 1. Clerk let them in
      await setActive?.({
        session: signInAttempt.createdSessionId,
        navigate: async () => {},
      });

      // 2. They are officially inside Clerk!
      sessionActivated = true;

      // 3. Ask Convex for the role
      const actualRole = await getSignedInAccountRoleWithRetry();

      // 4. No role found? Kick them back to login.
      if (!actualRole) {
        const errorMsg = encodeURIComponent("This account is missing a profile role. Please complete registration first.");
        await signOut({ redirectUrl: `${pathname}?role=${role}&error=${errorMsg}` });
        return;
      }

      // 5. Wrong tab? Auto-switch them and kick them back to login.
      if (actualRole !== role) {
        const errorMsg = encodeURIComponent(`This account is registered as a ${actualRole}. Please sign in using the correct tab.`);
        await signOut({ redirectUrl: `${pathname}?role=${actualRole}&error=${errorMsg}` });
        return;
      }

      // 6. Success!
      router.push("/");
    } catch (error) {
      // If the app crashes HERE, ONLY kick them out if they successfully passed Clerk.
      // This stops normal "Wrong Password" errors from accidentally calling signOut().
      if (sessionActivated) {
        try {
          await signOut();
        } catch (e) {
          console.error("Emergency sign out failed", e);
        }
      }

      if (isClerkAPIResponseError(error)) {
        if (handleRateLimitError(error)) {
          return;
        }

        setSubmitError(
          error.errors[0]?.longMessage ??
            error.errors[0]?.message ??
            "Invalid email or password.",
        );
      } else if (
        error instanceof Error &&
        error.message.includes("Unauthorized")
      ) {
        setSubmitError(
          "Signed in, but role validation failed. Check Clerk JWT template name 'convex' with audience 'convex'.",
        );
      } else {
        setSubmitError("Something went wrong while signing in.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="rounded-3xl border shadow-sm">
      <CardHeader className="text-center space-y-2 px-8 pt-8">
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>
          Sign in to your <span className="capitalize">{role}</span> account
        </CardDescription>
      </CardHeader>

      <CardContent className="px-8 pb-8 space-y-6">
        <p className="text-sm text-center font-semibold text-muted-foreground">
          Choose account type
        </p>

        <Tabs value={role} onValueChange={handleRoleChange} className="w-full">
<TabsList className="flex w-full gap-3 bg-transparent p-0 h-auto">
  <TabsTrigger
    value="student"
    className="flex-1 h-10 rounded-2xl border-2 font-semibold text-sm
               bg-white text-gray-400 border-gray-200
               transition-all duration-300
               data-[state=active]:border-blue-500 data-[state=active]:bg-blue-50
               data-[state=active]:text-blue-700 data-[state=active]:shadow-xl
               data-[state=active]:shadow-blue-500/15 data-[state=active]:scale-[1.02]"
  >
    <GraduationCap className="mr-2 h-5 w-5" />
    Student
  </TabsTrigger>

  <TabsTrigger
    value="employer"
    className="flex-1 h-10 rounded-2xl border-2 font-semibold text-sm
               bg-white text-gray-400 border-gray-200
               transition-all duration-300
               data-[state=active]:border-purple-500 data-[state=active]:bg-purple-50
               data-[state=active]:text-purple-700 data-[state=active]:shadow-xl
               data-[state=active]:shadow-purple-500/15 data-[state=active]:scale-[1.02]"
  >
    <Briefcase className="mr-2 h-5 w-5" />
    Employer
  </TabsTrigger>
</TabsList>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="name@example.com"
                type="email"
                {...register("email")}
                aria-invalid={!!errors.email}
              />
              {errors.email && (
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  href={`/forgot-password?role=${role}`}
                  className="text-sm text-muted-foreground hover:text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <PasswordInput
                id="password"
                placeholder="••••••••"
                {...register("password")}
                aria-invalid={!!errors.password}
              />
              {errors.password && (
                <p className="text-xs text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            {submitError && (
              <p className="text-sm text-red-500 text-center">{submitError}</p>
            )}

            <Button
              type="submit"
              disabled={isSubmitting || !isLoaded}
              className={`w-full h-11 text-base font-semibold text-white ${
                isEmployer
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </Button>

            <div className="flex items-center gap-3 py-2">
              <Separator className="flex-1 bg-gray-400" />
              <span className="text-xs uppercase text-muted-foreground whitespace-nowrap">
                Or continue with
              </span>
              <Separator className="flex-1 bg-gray-400" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Button variant="outline" type="button" className="h-11 hover:bg-zinc-100 transition-colors">
                <svg viewBox="0 0 24 24" className="h-4 w-4 mr-1.5 shrink-0">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </Button>
              <Button variant="outline" type="button" className="h-11 hover:bg-zinc-100 transition-colors">
                <svg viewBox="0 0 24 24" className="h-4 w-4 mr-1.5 shrink-0" fill="#0A66C2">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </Button>
              <Button variant="outline" type="button" className="h-11 hover:bg-zinc-100 transition-colors">
                <svg viewBox="0 0 24 24" className="h-4 w-4 mr-1.5 shrink-0" fill="currentColor">
                  <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
                </svg>
                GitHub
              </Button>
            </div>

            <div className="text-center text-sm pt-2">
              Don&apos;t have an account?{" "}
              <Link
                href={`/signup?role=${role}`}
                className="font-semibold text-primary hover:underline"
              >
                Sign up
              </Link>
            </div>
          </form>
        </Tabs>
      </CardContent>
    </Card>
  );
}