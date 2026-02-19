"use client";

import { Briefcase, GraduationCap } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

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

export default function LoginPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const role = searchParams.get("role") === "employer" ? "employer" : "student";
  const isEmployer = role === "employer";

  function handleRoleChange(value: string) {
    if (value !== "student" && value !== "employer") return;

    const params = new URLSearchParams(searchParams.toString());
    params.set("role", value);
    const queryString = params.toString();
    router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
      scroll: false,
    });
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

        <Tabs
          value={role}
          onValueChange={handleRoleChange}
          className="w-full"
        >
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

          <div className="mt-6 space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" placeholder="name@example.com" type="email" />
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
              <Input id="password" type="password" />
            </div>

            <Button
              className={`w-full h-11 text-base font-semibold text-white ${
                isEmployer
                  ? "bg-purple-600 hover:bg-purple-700"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              Sign in
            </Button>

            {/* Divider with lines */}
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
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
