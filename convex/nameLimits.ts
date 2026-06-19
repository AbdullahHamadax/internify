/** Max length per name field (first / last) after trim — shared by Convex + client. */
export const MAX_USER_NAME_FIELD_LENGTH = 60;

/** Minimum length per field after trim. */
export const MIN_USER_NAME_FIELD_LENGTH = 2;

/** Only apply vowel-ratio when this many letters — avoids false positives ("Ng", "Li"). */
const MIN_LETTERS_FOR_VOWEL_RATIO = 5;

/** Reject if vowel share of letters is below this (0–1). */
const MIN_VOWEL_RATIO = 0.15;

/** Same letter this many times in a row or more → reject (allows up to 3 in a row). */
const MAX_SAME_LETTER_RUN = 3;

/** Letters, spaces, hyphens, apostrophes only (Unicode letters). */
const NAME_SEGMENT_PATTERN = /^[\p{L}\s'-]+$/u;

const VOWEL_CHARS = new Set(
  "aeiouyáéíóúàèìòùäëïöüâêîôûœæøåãõąęįǫųýÿ",
);

/** Common keyboard-run substrings (length ≥ 4), lowercase. */
const KEYBOARD_WALK_SUBSTRINGS = [
  "asdf",
  "fdsa",
  "qwer",
  "rewq",
  "zxcv",
  "vcxz",
  "qwerty",
  "ytrewq",
  "hjkl",
  "lkjh",
  "wasd",
  "dsaw",
  "poiu",
  "uiop",
  "tyui",
  "yuiop",
  "fghj",
  "dfgh",
  "vbnm",
  "sdfg",
  "xcvb",
  "wert",
  "erty",
];

function lettersOnly(segment: string): string {
  return segment.replace(/[^\p{L}]/gu, "");
}

function hasExcessiveLetterRun(segment: string): boolean {
  const re = new RegExp(`(.)\\1{${MAX_SAME_LETTER_RUN},}`, "u");
  return re.test(segment);
}

function hasKeyboardWalk(segment: string): boolean {
  const compact = segment.toLowerCase().replace(/[\s'-]/g, "");
  if (compact.length < 4) return false;
  return KEYBOARD_WALK_SUBSTRINGS.some((w) => compact.includes(w));
}

function vowelRatioOfLetters(letters: string): number {
  if (letters.length === 0) return 0;
  let vowels = 0;
  for (const ch of letters.toLowerCase().normalize("NFD")) {
    const base = ch.replace(/\p{M}/gu, "");
    if (base && VOWEL_CHARS.has(base)) vowels++;
  }
  return vowels / letters.length;
}

/**
 * Validates one name part (first or last) after trim.
 * Callers should pass trimmed strings; empty is invalid if the field is required.
 */
export function validateSingleNameField(
  segment: string,
  fieldLabel: "First name" | "Last name",
): string | null {
  if (segment.length < MIN_USER_NAME_FIELD_LENGTH) {
    return `${fieldLabel} must be at least ${MIN_USER_NAME_FIELD_LENGTH} characters.`;
  }
  if (segment.length > MAX_USER_NAME_FIELD_LENGTH) {
    return `${fieldLabel} must be at most ${MAX_USER_NAME_FIELD_LENGTH} characters.`;
  }
  if (!NAME_SEGMENT_PATTERN.test(segment)) {
    return `${fieldLabel} can only contain letters, spaces, hyphens, and apostrophes.`;
  }
  if (hasExcessiveLetterRun(segment)) {
    return `${fieldLabel} can't have the same letter repeated more than ${MAX_SAME_LETTER_RUN} times in a row.`;
  }
  if (hasKeyboardWalk(segment)) {
    return `${fieldLabel} looks like random keyboard input — try your real name.`;
  }
  const letters = lettersOnly(segment);
  if (letters.length >= MIN_LETTERS_FOR_VOWEL_RATIO) {
    const ratio = vowelRatioOfLetters(letters);
    if (ratio < MIN_VOWEL_RATIO) {
      return `${fieldLabel} doesn't look like a real name (too few vowels).`;
    }
  }
  return null;
}

export function validateUserNameFields(
  firstName?: string | null,
  lastName?: string | null,
): string | null {
  const f = (firstName ?? "").trim();
  const l = (lastName ?? "").trim();

  // Only validate if the field is actually provided (non-empty).
  // Clerk OAuth flows don't always supply both names.
  if (f.length > 0) {
    const firstErr = validateSingleNameField(f, "First name");
    if (firstErr) return firstErr;
  }

  if (l.length > 0) {
    const lastErr = validateSingleNameField(l, "Last name");
    if (lastErr) return lastErr;
  }

  return null;
}

export function assertValidUserNameFields(
  firstName?: string | null,
  lastName?: string | null,
): void {
  const err = validateUserNameFields(firstName, lastName);
  if (err) throw new Error(err);
}
