/**
 * Shared helper for recommendation scoring.
 * Mirrors the normalize logic from src/lib/skillMatching.ts
 * but lives inside convex/ so it can be imported by server-side code.
 */
export function skillMatchKey(s: string): string {
  return s.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}
