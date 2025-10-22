import type { t } from '../common.ts';
import { validateTraitExistence } from './u.trait.existence.ts';
import { validateAliasRules, validatePropsShape } from './u.trait.props.ts';

type L = t.SlugValidationLib;

/**
 * Low-level semantic pass:
 * Runs existence → alias rules → prop-shape, and returns semantic errors.
 * (Structural/schema errors are handled earlier by <SlugSchema>).
 */
export const validateSlugAgainstRegistry: L['validateSlugAgainstRegistry'] = (input) => {
  // Order matters:
  //  1. existence (unknown trait ids)
  //  2. alias rules (duplicates / missing / orphans)
  //  3. prop shapes (only for aliases with known trait ids)
  const a = validateTraitExistence(input);
  const b = validateAliasRules(input);
  const c = validatePropsShape(input);
  return [...a, ...b, ...c];
};

/**
 * Convenience wrapper returning { valid, errors }.
 */
export const validateSlug: L['validateSlug'] = (input: t.SlugValidateInput) => {
  const errors = validateSlugAgainstRegistry(input);
  return { valid: errors.length === 0, errors };
};
