import type { t } from '../common.ts';

/**
 * Low-level semantic pass: returns only semantic (non-structural) errors.
 */
export function validateSlugAgainstRegistry(
  input: t.SlugValidateInput,
): t.Schema.ValidationError[] {
  return [];
}

/**
 * Convenience wrapper returning { valid, errors }.
 */
export function validateSlug(input: t.SlugValidateInput): t.SlugValidateResult {
  const errors = validateSlugAgainstRegistry(input);
  return { valid: errors.length === 0, errors };
}
