import { type t, Slug } from './common.ts';

const validateWithRanges = Slug.Validation.SlugTree.validateWithRanges;

/**
 * Run deep semantic validation for any slug-tree aliases
 * found under `slug.data`.
 *
 * @returns a flat list of editor diagnostics with YAML ranges attached.
 */
export function validateSlugTreeDeep(args: {
  ast: t.Yaml.Ast;
  slug: t.Slug;
  registry: t.SlugTraitRegistry;
  severity?: t.DiagnosticSeverity;
}): readonly t.EditorDiagnostic[] {
  const { ast, slug, registry } = args;
  const severity = args.severity ?? 'Error';
  const out: t.EditorDiagnostic[] = [];

  if (Slug.Is.ref(slug) || !Slug.Has.data(slug)) return out;
  const data = slug.data;

  for (const [alias, tree] of Object.entries(data)) {
    if (!Array.isArray(tree)) continue; // ← only [arrays] are candidate SlugTrees.
    const basePath = ['data', alias];
    const diags = validateWithRanges({ ast, registry, tree, basePath, severity });
    out.push(...diags);
  }

  return out;
}
