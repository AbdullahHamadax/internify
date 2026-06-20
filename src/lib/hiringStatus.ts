export const EMPLOYER_HIRING_OPTIONS = [
  {
    value: "hiring",
    label: "Hiring",
    badgeClassName: "bg-[#A7F3D0] text-black",
    dotClassName: "bg-[#047857]",
    itemClassName:
      "focus:bg-[#A7F3D0] focus:text-black data-[state=checked]:bg-[#A7F3D0] data-[state=checked]:text-black",
  },
  {
    value: "selective",
    label: "Selectively Hiring",
    badgeClassName: "bg-[#FCD34D] text-black",
    dotClassName: "bg-[#B45309]",
    itemClassName:
      "focus:bg-[#FCD34D] focus:text-black data-[state=checked]:bg-[#FCD34D] data-[state=checked]:text-black",
  },
  {
    value: "not_hiring",
    label: "Not Hiring",
    badgeClassName: "bg-[#EA4335] text-white",
    dotClassName: "bg-[#7f1d1d]",
    itemClassName:
      "focus:bg-[#EA4335] focus:text-white data-[state=checked]:bg-[#EA4335] data-[state=checked]:text-white",
  },
] as const;

export type EmployerHiringStatus =
  (typeof EMPLOYER_HIRING_OPTIONS)[number]["value"];

export type EmployerHiringOption = (typeof EMPLOYER_HIRING_OPTIONS)[number];

export const DEFAULT_EMPLOYER_HIRING_STATUS: EmployerHiringStatus = "hiring";

export const EMPLOYER_HIRING_BY_STATUS = EMPLOYER_HIRING_OPTIONS.reduce(
  (acc, option) => {
    acc[option.value] = option;
    return acc;
  },
  {} as Record<EmployerHiringStatus, EmployerHiringOption>,
);

export function normalizeEmployerHiringStatus(
  status: string | null | undefined,
): EmployerHiringStatus {
  if (status && status in EMPLOYER_HIRING_BY_STATUS) {
    return status as EmployerHiringStatus;
  }
  return DEFAULT_EMPLOYER_HIRING_STATUS;
}

export function getEmployerHiringMeta(
  status: string | null | undefined,
): EmployerHiringOption {
  return EMPLOYER_HIRING_BY_STATUS[normalizeEmployerHiringStatus(status)];
}
