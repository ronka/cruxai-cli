/**
 * Validates that a string value is one of the allowed enum values.
 * Use with shadcn Select onValueChange to avoid unsafe string casts.
 *
 * @example
 * onValueChange={(v) => { const role = asEnum(v, QUESTION_ROLES); if (role) setRole(role); }}
 */
export function asEnum<T extends string>(
  value: string,
  validValues: readonly T[]
): T | undefined {
  return validValues.includes(value as T) ? (value as T) : undefined;
}
