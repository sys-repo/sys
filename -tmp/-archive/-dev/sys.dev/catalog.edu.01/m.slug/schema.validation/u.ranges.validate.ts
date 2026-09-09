import type { t } from '../common.ts';
import { attachSemanticRanges } from './u.ranges.attach.ts';
import { validateSlugAgainstRegistry } from './u.traits.ts';

type L = t.SlugValidationLib;

/**
 * Run semantic validation and attach YAML AST ranges.
 * - Validators must return *relative* paths.
 * - `basePath` is applied only here when attaching ranges.
 */
export const validateWithRanges: L['validateWithRanges'] = (args) => {
  const { ast, slug, registry, basePath } = args;
  const errs = validateSlugAgainstRegistry({ slug, registry });
  attachSemanticRanges(ast, errs, { basePath });
  return errs;
};
