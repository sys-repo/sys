import { type t, Type as T, Yaml } from './common.ts';
import { SlugRules } from './u.slug.rules.ts';
import { validateSlugTreeDeep } from './u.slug.tree.ts';

/**
 * Run all semantic rules for YamlPipeline.Slug.fromYaml.
 * Returns semantic ValidationErrors only (schema & yaml handled elsewhere).
 *
 * Notes:
 * - Deep slug-tree validation needs a SlugTraitRegistry to validate nested trait props.
 *   If none is available, we adapt `isKnown` into a minimal registry (propsSchema = T.Unknown()).
 *   This still surfaces orphan/missing data errors; prop-shape checks require a real registry.
 */
export function evaluateSemanticRules(args: {
  ast: t.Yaml.Ast;
  path: t.ObjectPath;
  candidate: t.Slug; //              ← already schema-validated & normalized
  isKnown?: t.SlugIsKnown; //        ← existence check for trait IDs
  registry?: t.SlugTraitRegistry; // ← optional full registry (prefers this when available)
}): t.Schema.ValidationError[] {
  const { ast, path, candidate, isKnown } = args;
  const out: t.Schema.ValidationError[] = [];

  const effectiveIsKnown: t.SlugIsKnown | undefined =
    isKnown ?? (args.registry ? (id) => !!args.registry!.get(id) : undefined);

  /**
   * 1. Core slug-level semantic rules (flat, registry-aware where needed).
   */
  SlugRules.aliasUniqueness(out, path, candidate);

  const isKnownOrUndefined = effectiveIsKnown ? { isKnown: effectiveIsKnown } : undefined;
  SlugRules.traitTypeKnown(out, path, candidate, isKnownOrUndefined);

  SlugRules.missingDataForAlias(out, path, candidate);
  SlugRules.orphanData(out, path, candidate);

  /**
   * 2. Deep slug-tree validation for array-valued data aliases.
   */
  const registry = args.registry ?? {
    all: [],
    get: (id: string) =>
      effectiveIsKnown?.(id) ? { id, propsSchema: T.Unknown() as t.TSchema } : undefined,
  };

  const deep = validateSlugTreeDeep({
    ast,
    slug: candidate,
    registry,
    severity: 'Error',
  });

  // Convert editor diagnostics → semantic ValidationErrors (ranges attached later).
  for (const d of deep) {
    const range = Yaml.Range.normalize(d.range);
    out.push({
      kind: 'semantic',
      path: (d as { path?: t.ObjectPath }).path ?? [],
      message: d.message,
      ...(range && { range }),
    });
  }

  /**
   * Finish up:
   */
  return out;
}
