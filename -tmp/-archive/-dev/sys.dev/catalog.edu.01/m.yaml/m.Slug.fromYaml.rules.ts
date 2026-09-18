import { type t, Type as T, Yaml } from './common.ts';
import { SlugRules } from './u.slug.rules.ts';
import { validateSlugTreeDeep } from './u.slug.tree.ts';

/**
 * Run all semantic rules for YamlPipeline.Slug.fromYaml.
 * Returns semantic ValidationErrors only (schema & yaml handled elsewhere).
 *
 * Notes:
 * - Deep slug-tree validation needs a SlugTraitRegistry to validate nested trait props.
 *   This still surfaces orphan/missing data errors; prop-shape checks require a real registry.
 */
export function evaluateSemanticRules(args: {
  ast: t.Yaml.Ast;
  path: t.ObjectPath;
  candidate: t.Slug; //              ← already schema-validated & normalized
  registry?: t.SlugTraitRegistry;
}): t.Schema.ValidationError[] {
  const { ast, path, candidate } = args;
  const out: t.Schema.ValidationError[] = [];

  const isKnown: t.SlugIsKnown | undefined = args.registry
    ? (id) => !!args.registry!.get(id)
    : undefined;

  /**
   * 1. Core slug-level semantic rules (flat, registry-aware where needed).
   */
  SlugRules.aliasUniqueness(out, path, candidate);
  SlugRules.traitTypeKnown(out, path, candidate, isKnown ? { isKnown } : undefined);
  SlugRules.missingDataForAlias(out, path, candidate);
  SlugRules.orphanData(out, path, candidate);

  /**
   * 2. Deep slug-tree validation for array-valued data aliases.
   */
  const registry = args.registry ?? {
    all: [],
    get: (id: string) => (isKnown?.(id) ? { id, propsSchema: T.Unknown() } : undefined),
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
