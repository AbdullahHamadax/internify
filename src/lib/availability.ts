export const STUDENT_AVAILABILITY_OPTIONS = [
  {
    value: "available_now",
    label: "Available Now",
    badgeClassName: "bg-[#A7F3D0] text-[#047857]",
    dotClassName: "bg-[#047857]",
    itemClassName:
      "focus:bg-[#A7F3D0] focus:text-[#047857] data-[state=checked]:bg-[#A7F3D0] data-[state=checked]:text-[#047857]",
  },
  {
    value: "open_to_offers",
    label: "Open to Offers",
    badgeClassName: "bg-[#2563EB] text-white",
    dotClassName: "bg-[#2563EB]",
    itemClassName:
      "focus:bg-[#2563EB] focus:text-white data-[state=checked]:bg-[#2563EB] data-[state=checked]:text-white",
  },
  {
    value: "busy",
    label: "Busy",
    badgeClassName: "bg-[#FDE68A] text-black",
    dotClassName: "bg-[#F59E0B]",
    itemClassName:
      "focus:bg-[#FDE68A] focus:text-black data-[state=checked]:bg-[#FDE68A] data-[state=checked]:text-black",
  },
  {
    value: "unavailable",
    label: "Unavailable",
    badgeClassName: "bg-[#F43F5E] text-white",
    dotClassName: "bg-[#F43F5E]",
    itemClassName:
      "focus:bg-[#F43F5E] focus:text-white data-[state=checked]:bg-[#F43F5E] data-[state=checked]:text-white",
  },
] as const;

export type StudentAvailabilityStatus =
  (typeof STUDENT_AVAILABILITY_OPTIONS)[number]["value"];

export type StudentAvailabilityOption =
  (typeof STUDENT_AVAILABILITY_OPTIONS)[number];

export const DEFAULT_STUDENT_AVAILABILITY_STATUS: StudentAvailabilityStatus =
  "available_now";

export const STUDENT_AVAILABILITY_BY_STATUS =
  STUDENT_AVAILABILITY_OPTIONS.reduce(
    (acc, option) => {
      acc[option.value] = option;
      return acc;
    },
    {} as Record<StudentAvailabilityStatus, StudentAvailabilityOption>,
  );

export const STUDENT_AVAILABILITY_SORT_RANK: Record<
  StudentAvailabilityStatus,
  number
> = {
  available_now: 0,
  open_to_offers: 1,
  busy: 2,
  unavailable: 3,
};

export function normalizeStudentAvailabilityStatus(
  status: string | null | undefined,
): StudentAvailabilityStatus {
  if (status && status in STUDENT_AVAILABILITY_BY_STATUS) {
    return status as StudentAvailabilityStatus;
  }

  return DEFAULT_STUDENT_AVAILABILITY_STATUS;
}

export function getStudentAvailabilityMeta(
  status: string | null | undefined,
): StudentAvailabilityOption {
  return STUDENT_AVAILABILITY_BY_STATUS[
    normalizeStudentAvailabilityStatus(status)
  ];
}
