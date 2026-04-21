import { extractTextFromPdf } from "@/lib/pdfTextExtractor";
import type { Id } from "../../convex/_generated/dataModel";

export type StudentAcademicStatus = "undergraduate" | "graduate";

export type ParsedStudentCvProfile = {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  city?: string;
  location?: string;
  title?: string;
  description?: string;
  portfolio?: string;
  github?: string;
  linkedin?: string;
  skills?: string[];
  university?: string;
  degree?: string;
  graduationYear?: number;
  gpa?: number;
};

type StudentProfileSeed = {
  academicStatus: StudentAcademicStatus;
  fieldOfStudy: string;
  cvFileName?: string;
  cvStorageId?: Id<"_storage">;
};

const PDF_PARSE_ONLY_MESSAGE =
  "We saved your CV, but only PDF files can be auto-filled right now. Please complete the remaining profile fields manually.";

export async function parseStudentProfileFromCv(file: File): Promise<{
  parsedProfile: ParsedStudentCvProfile | null;
  parseError: string | null;
}> {
  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (!isPdf) {
    return {
      parsedProfile: null,
      parseError: PDF_PARSE_ONLY_MESSAGE,
    };
  }

  try {
    const cvText = await extractTextFromPdf(file);

    if (!cvText || cvText.trim().length < 50) {
      return {
        parsedProfile: null,
        parseError:
          "We saved your CV, but couldn't extract enough text to auto-fill your profile. Please complete the remaining fields manually.",
      };
    }

    const response = await fetch("/api/parse-cv-profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cvText }),
    });

    const body = await response.json();

    if (!response.ok) {
      return {
        parsedProfile: null,
        parseError:
          typeof body?.error === "string"
            ? body.error
            : "We saved your CV, but couldn't auto-fill your profile. Please complete the remaining fields manually.",
      };
    }

    return {
      parsedProfile:
        body?.profile && typeof body.profile === "object" ? body.profile : null,
      parseError: null,
    };
  } catch (error) {
    return {
      parsedProfile: null,
      parseError:
        error instanceof Error
          ? error.message
          : "We saved your CV, but couldn't auto-fill your profile. Please complete the remaining fields manually.",
    };
  }
}

export function buildStudentProfileFromCv(
  seed: StudentProfileSeed,
  parsedProfile: ParsedStudentCvProfile | null,
) {
  const resolvedCity = parsedProfile?.city?.trim();
  const resolvedLocation =
    parsedProfile?.location?.trim() ||
    (resolvedCity ? `${resolvedCity}, Egypt` : undefined);
  const resolvedSkills =
    parsedProfile?.skills?.filter((skill) => skill.trim().length > 0) ?? [];

  return {
    academicStatus: seed.academicStatus,
    fieldOfStudy: seed.fieldOfStudy,
    title: parsedProfile?.title?.trim() || undefined,
    location: resolvedLocation,
    description: parsedProfile?.description?.trim() || undefined,
    portfolio: parsedProfile?.portfolio?.trim() || undefined,
    github: parsedProfile?.github?.trim() || undefined,
    linkedin: parsedProfile?.linkedin?.trim() || undefined,
    skills: resolvedSkills.length > 0 ? resolvedSkills : undefined,
    cvStorageId: seed.cvStorageId,
    cvFileName: seed.cvFileName,
    university: parsedProfile?.university?.trim() || undefined,
    degree: parsedProfile?.degree?.trim() || undefined,
    graduationYear: parsedProfile?.graduationYear,
    gpa: parsedProfile?.gpa,
    phone: parsedProfile?.phone?.trim() || undefined,
    city: resolvedCity || undefined,
  };
}

export function getMissingRequiredCvProfileFields(
  profile:
    | Partial<ReturnType<typeof buildStudentProfileFromCv>>
    | null
    | undefined,
) {
  const missing: string[] = [];

  if (!profile?.university) missing.push("University");
  if (!profile?.degree) missing.push("Bachelor's Degree Name");
  if (!profile?.graduationYear) missing.push("Graduation Year");
  if (profile?.gpa == null) missing.push("GPA");
  if (!profile?.phone) missing.push("Phone Number");
  if (!profile?.city) missing.push("City");

  return missing;
}
