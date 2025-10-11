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
 * - If a YAML node exists at that path, attaches its `range` (and `linePos` if available).
 */
export function attachSemanticRanges(
  ast: t.Yaml.Ast,
  errs: t.Schema.ValidationError[],
  opts?: { basePath?: t.ObjectPath },
): void {
  const base = opts?.basePath ?? [];

  for (const item of errs) {
    const err = item as MutableValidationError;

    // 1. Normalize to absolute path:
    const rel = (err.path ?? []) as t.ObjectPath;
    const abs = Obj.Path.join(base, rel, 'absolute');
    err.path = abs;

    // 2. Resolve node at absolute path:
    const node = Yaml.Path.atPath(ast, abs) as NodeWithRange | undefined;
    if (!node) continue;

    // 3. Attach range and linePos if available:
    if (node.range) err.range = node.range;
    if (node.linePos) err.linePos = node.linePos;
  }
}
