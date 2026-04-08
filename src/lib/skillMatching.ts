/**
 * Compare stored skill labels (tasks, profiles) to catalog / filter selections.
 * Normalizes case and non-alphanumeric separators so "Tailwind CSS" matches "Tailwindcss".
 */
export function skillMatchKey(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function skillsMatch(a: string, b: string): boolean {
  return skillMatchKey(a) === skillMatchKey(b);
}

/** OR semantics: any selected skill matches any entity skill. */
export function entityMatchesSkillFilter(
  entitySkills: string[],
  selectedCatalogSkills: string[],
): boolean {
  if (selectedCatalogSkills.length === 0) return true;
  return selectedCatalogSkills.some((sel) =>
    entitySkills.some((s) => skillsMatch(s, sel)),
  );
}
