/** Max length per name field (first / last) after trim — shared by Convex + client. */
export const MAX_USER_NAME_FIELD_LENGTH = 60;

export function validateUserNameFields(
  firstName?: string | null,
  lastName?: string | null,
): string | null {
  const f = (firstName ?? "").trim();
  const l = (lastName ?? "").trim();
  if (f.length > MAX_USER_NAME_FIELD_LENGTH) {
    return `First name must be at most ${MAX_USER_NAME_FIELD_LENGTH} characters.`;
  }
  if (l.length > MAX_USER_NAME_FIELD_LENGTH) {
    return `Last name must be at most ${MAX_USER_NAME_FIELD_LENGTH} characters.`;
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
