"use client";

import { Building2, GraduationCap, Upload, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";

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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Role = "student" | "employer";
type Step = 0 | 1 | 2;
type AcademicStatus = "undergraduate" | "graduate";

export default function SignUpPage() {
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

  // Step 1 fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Step 2 - Student
  const [academicStatus, setAcademicStatus] =
    useState<AcademicStatus>("undergraduate");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [cvFile, setCvFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Step 2 - Employer
  const [companyName, setCompanyName] = useState("");
  const [position, setPosition] = useState("");
  const [rankLevel, setRankLevel] = useState("");

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

  const progressValue = step === 1 ? 50 : step === 2 ? 100 : 0;

  const canContinueStep1 =
    firstName.trim() && lastName.trim() && email.trim() && password.length >= 8;

  const canCompleteStep2 = useMemo(() => {
    if (!role) return false;
    if (!isEmployer) return fieldOfStudy.trim().length > 0;
    return (
      companyName.trim().length > 0 &&
      position.trim().length > 0 &&
      rankLevel.trim().length > 0
    );
  }, [role, isEmployer, fieldOfStudy, companyName, position, rankLevel]);

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
    syncRoleQuery(r);
  }

  function goBack() {
    if (step === 2) return setStep(1);
    if (step === 1) {
      setStep(0);
      setRole(null);
      syncRoleQuery(null);
    }
  }

  function pickFile() {
    fileInputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCvFile(e.target.files?.[0] ?? null);
  }

  // STEP 0: Role selection
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
            className="group w-full flex items-start gap-4 p-5 border rounded-2xl text-left transition-all
                       hover:shadow-sm hover:-translate-y-[1px]
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
            className="group w-full flex items-start gap-4 p-5 border rounded-2xl text-left transition-all
                       hover:shadow-sm hover:-translate-y-[1px]
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

  // STEP 1/2 wrapper
  const loginHref = role ? `/login?role=${role}` : "/login";

  return (
    <Card className="rounded-3xl border shadow-sm">
      <CardHeader className="px-4 sm:px-8 pt-8 ">
        <div className="flex items-center justify-between text-sm">
          <Badge variant="secondary" className="capitalize font-normal text-sm">
            {role}
          </Badge>
          <span className="text-muted-foreground">Step {step} of 2</span>
        </div>

        <Progress value={progressValue} className="h-2" />

        <div className="text-center space-y-1">
          <CardTitle className="text-2xl">
            {step === 1 ? "Create your account" : "Complete your profile"}
          </CardTitle>
          <CardDescription>
            {step === 1
              ? "Enter your basic account details"
              : "Tell us more about yourself"}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="px-4 sm:px-8 pb-8 space-y-6">
        {/* STEP 1 */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters long
              </p>
            </div>

            {/* FIXED BUTTON ROW (no overflow) */}
            <div className="grid grid-cols-1 min-[375px]:grid-cols-2 gap-3 pt-2">
              <Button variant="outline" onClick={goBack}>
                Back
              </Button>
              <Button
                className={`text-white font-semibold text-xs min-[375px]:text-sm whitespace-normal ${theme.primaryBtn}`}
                disabled={!canContinueStep1}
                onClick={() => setStep(2)}
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
          </div>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <div className="space-y-5">
            {/* STUDENT */}
            {!isEmployer && (
              <>
                <div className="space-y-2">
                  <Label>Academic Status</Label>
                  <ToggleGroup
                    type="single"
                    value={academicStatus}
                    onValueChange={(v) =>
                      v && setAcademicStatus(v as AcademicStatus)
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
                    value={fieldOfStudy}
                    onChange={(e) => setFieldOfStudy(e.target.value)}
                  />
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
              </>
            )}

            {/* EMPLOYER */}
            {isEmployer && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    placeholder="e.g., TechCorp Inc."
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="position">Your Role / Position</Label>
                  <Input
                    id="position"
                    placeholder="e.g., HR Manager, Tech Lead, CEO..."
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Rank / Level</Label>
                  <Select value={rankLevel} onValueChange={setRankLevel}>
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
                </div>
              </>
            )}

            {/* FIXED BUTTON ROW */}
            <div className="grid grid-cols-1 min-[450px]:grid-cols-2 gap-3 pt-2">
              <Button variant="outline" onClick={goBack}>
                Back
              </Button>
              <Button
                className={`text-white font-semibold text-sm whitespace-normal ${theme.primaryBtn}`}
                disabled={!canCompleteStep2}
                onClick={() => {
                  console.log("SIGNUP PAYLOAD", {
                    role,
                    firstName,
                    lastName,
                    email,
                    password,
                    academicStatus,
                    fieldOfStudy,
                    cvFileName: cvFile?.name ?? null,
                    companyName,
                    position,
                    rankLevel,
                  });
                }}
              >
                Complete Registration
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
