import { type t, Obj, Yaml } from '../common.ts';

type L = t.SlugValidationLib;
type NodeWithRange = { range?: t.Yaml.Range; linePos?: t.Yaml.LinePosTuple };
type MutableValidationError = t.Schema.ValidationError & {
  path?: t.ObjectPath;
  range?: t.Yaml.Range;
  linePos?: t.Yaml.LinePosTuple;
};

/**
 * Attach YAML AST ranges to semantic validation errors.
 * - Mutates `errs` in-place.
 * - Rewrites each error `path` to an absolute path using `basePath`.
 * - Resolves the node via `Yaml.Path.atPath` and copies its `range`/`linePos` (if present).
 */
export const attachSemanticRanges: L['attachSemanticRanges'] = (ast, errs, opts = {}) => {
  const base = opts.basePath ?? [];

  for (const item of errs) {
    const err = item as MutableValidationError;

    // 1) Normalize path to absolute
    const rel = (err.path ?? []) as t.ObjectPath;
    const abs = Obj.Path.join(base, rel, 'absolute');
    err.path = abs;

    // 2) Resolve node and copy range/linePos if available
    const node = Yaml.Path.atPath(ast, abs) as NodeWithRange | undefined;
    if (!node) continue;

    if (node.range) err.range = node.range;
    if (node.linePos) err.linePos = node.linePos;
  }
};
