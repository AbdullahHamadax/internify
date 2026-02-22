// app/(auth)/login/page.tsx
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
          <TabsList className="grid w-full grid-cols-2 h-12 rounded-full bg-muted p-1 border">
            <TabsTrigger
              value="student"
              className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm
                         text-muted-foreground data-[state=active]:text-blue-600"
            >
              <GraduationCap className="mr-2 h-4 w-4" />
              Student
            </TabsTrigger>

            <TabsTrigger
              value="employer"
              className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm
                         text-muted-foreground data-[state=active]:text-purple-600"
            >
              <Briefcase className="mr-2 h-4 w-4" />
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
                  href="#"
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

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" type="button">
                Google
              </Button>
              <Button variant="outline" type="button">
                LinkedIn
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