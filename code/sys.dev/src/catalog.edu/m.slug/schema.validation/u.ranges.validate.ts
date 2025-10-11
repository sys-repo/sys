import type { t } from '../common.ts';
import { attachSemanticRanges } from './u.ranges.attach.ts';
import { validateSlugAgainstRegistry } from './u.traits.ts';

/**
 * Run semantic validation and attach YAML ranges.
 * - Validators must return `relative` paths.
 * - `basePath` is applied only here when attaching ranges.
 */
export function validateWithRanges(args: {
  readonly ast: t.Yaml.Ast;
  readonly slug: unknown;
  readonly registry: t.SlugTraitRegistry;
  readonly basePath?: t.ObjectPath;
}): t.Schema.ValidationError[] {
  const { ast, slug, registry, basePath } = args;
  const errs = validateSlugAgainstRegistry({ slug, registry });
  attachSemanticRanges(ast, errs, { basePath });
  return errs;
}
