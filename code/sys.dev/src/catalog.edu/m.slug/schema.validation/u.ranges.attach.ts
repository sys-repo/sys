import { type t, Obj, Yaml } from '../common.ts';

type NodeWithRange = { range?: t.Yaml.Range; linePos?: t.Yaml.LinePosTuple };
type MutableValidationError = t.Schema.ValidationError & {
  path?: t.ObjectPath;
  range?: t.Yaml.Range;
  linePos?: t.Yaml.LinePosTuple;
};

/**
 * Attach YAML source ranges to semantic validation errors.
 * - Mutates `errs` in-place.
 * - Rewrites each error `path` to an absolute path using `basePath`.
 * - If a source-map is provided, uses it to attach precise token spans.
 * - Falls back to the AST node’s range/linePos when no map hit is found.
 */
export function attachSemanticRanges(
  ast: t.Yaml.Ast,
  errs: t.Schema.ValidationError[],
  opts?: { basePath?: t.ObjectPath; map?: t.Yaml.SourceMapLike },
): void {
  const base = opts?.basePath ?? [];
  const map = opts?.map;

  for (const item of errs) {
    const err = item as MutableValidationError;

    // 1. Normalize to absolute path:
    const rel = (err.path ?? []) as t.ObjectPath;
    const abs = Obj.Path.join(base, rel, 'absolute');
    err.path = abs;

    // 2. Prefer source-map (precise token spans), if available:
    if (map) {
      const hit = Yaml.Ast.locate(map, abs);
      if (hit?.pos) err.range = hit.pos;
      if (hit?.linePos) err.linePos = hit.linePos;
      if (err.range) continue; // Done for this error.
    }

    // 3. Fallback: resolve node at absolute path via AST:
    const node = Yaml.Path.atPath(ast, abs) as NodeWithRange | undefined;
    if (!node) continue;

    if (node.range) err.range = node.range;
    if (node.linePos) err.linePos = node.linePos;
  }
}
