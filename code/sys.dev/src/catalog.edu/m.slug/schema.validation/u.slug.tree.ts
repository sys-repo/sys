import { type t } from '../common.ts';
import { SlugSurface } from '../m.Slug.Surface.ts';
import { attachSemanticRanges } from './u.ranges.attach.ts';
import { validateWithRanges } from './u.ranges.validate.ts';

type L = t.SlugTreeValidationLib;

/**
 * Deep semantic validation of inline slugs inside a SlugTree.
 * Produces editor diagnostics with attached YAML ranges, consistent with the flat validator.
 */
export const validateSlugTreeWithRanges: L['validateWithRanges'] = (args: {
  ast: t.Yaml.Ast;
  tree: unknown;
  registry: t.SlugTraitRegistry;
  basePath?: t.ObjectPath; // typically ['data', <alias>]
  severity?: t.DiagnosticSeverity;
}): t.EditorDiagnostic[] => {
  const { ast, tree, registry } = args;
  if (!Array.isArray(tree)) return [];

  const base = args.basePath ?? [];
  const severity = args.severity ?? 'Error';
  const diagnostics: t.EditorDiagnostic[] = [];

  for (const { node, path } of walkSlugTree(tree, base)) {
    // 1. Validate to relative pathed errors (no `basePath` passed here).
    const slug = SlugSurface.fromTreeItem(node);
    const errs = validateWithRanges({ ast, slug, registry });

    // 2. Attach ranges (this step applies the node `basePath` for YAML mapping).
    attachSemanticRanges(ast, errs, { basePath: path });

    // 3. Emit final diagnostics as literals.
    for (const e of errs) {
      const { message, range } = e;
      const p0 = e.path; // ← may be absolute (after attachSemanticRanges) or <undefined>.
      const p = Array.isArray(p0) ? p0 : path;
      diagnostics.push({
        message,
        severity,
        path: p,
        ...(range && { range }),
      });
    }
  }

  return diagnostics;
};

/**
 * DFS: Depth-first walk over SlugTree items, yielding {node, path} pairs.
 * - `path` is the object path of the current item root (eg: ['data','foo', 1]).
 */
function* walkSlugTree(
  tree: readonly t.SlugTreeItem[],
  basePath: t.ObjectPath,
): Generator<{ node: t.SlugTreeItem; path: t.ObjectPath }> {
  for (let i = 0; i < tree.length; i++) {
    const node = tree[i]!;
    const path: t.ObjectPath = [...basePath, i];
    yield { node, path };

    const children = node.slugs ?? [];
    if (children.length > 0) {
      yield* walkSlugTree(children, [...path, 'slugs']);
    }
  }
}
