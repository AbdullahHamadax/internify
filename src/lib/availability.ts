export const STUDENT_AVAILABILITY_OPTIONS = [
  {
    // "available_now" was merged into this status — both meant the same thing.
    // Legacy "available_now" values normalize to this one (see normalize fn).
    value: "open_to_offers",
    label: "Open for Offers",
    badgeClassName: "bg-[#A7F3D0] text-black",
    dotClassName: "bg-[#047857]",
    itemClassName:
      "focus:bg-[#A7F3D0] focus:text-black data-[state=checked]:bg-[#A7F3D0] data-[state=checked]:text-black",
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
  "open_to_offers";

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
  open_to_offers: 0,
  busy: 1,
  unavailable: 2,
};

export function normalizeStudentAvailabilityStatus(
  status: string | null | undefined,
): StudentAvailabilityStatus {
  if (status && status in STUDENT_AVAILABILITY_BY_STATUS) {
    return status as StudentAvailabilityStatus;
  }

  // Anything unknown — including the retired "available_now" — falls back to the
  // default ("open_to_offers"), which is exactly the status it merged into.
  return DEFAULT_STUDENT_AVAILABILITY_STATUS;
}

export function getStudentAvailabilityMeta(
  status: string | null | undefined,
): StudentAvailabilityOption {
  return STUDENT_AVAILABILITY_BY_STATUS[
    normalizeStudentAvailabilityStatus(status)
  ];
}
