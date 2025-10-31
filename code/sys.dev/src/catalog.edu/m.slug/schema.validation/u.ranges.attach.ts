import { type t, Log, Obj, Yaml } from '../common.ts';

type L = t.SlugValidationLib;
type NodeWithRange = { range?: t.Yaml.Range; linePos?: t.Yaml.LinePosTuple };
type MutableValidationError = t.Schema.ValidationError & {
  path?: t.ObjectPath;
  range?: t.Yaml.Range;
  linePos?: t.Yaml.LinePosTuple;
};

const pathStr = (p: t.ObjectPath) => p.join('/');
const rangeStr = (r: t.Yaml.Range) => `${r[0]},${r[1]}`;

const logInfo = Log.category('slug:attachSemanticRanges');

/**
 * Attach YAML AST ranges to semantic validation errors.
 * - Mutates `errs` in-place.
 * - Rewrites each error `path` to an absolute path using `basePath`.
 * - Resolves the node via `Yaml.Path.atPath` and copies its `range`/`linePos` (if present).
 */
export const attachSemanticRanges: L['attachSemanticRanges'] = (ast, errs, opts = {}) => {
  const base = opts.basePath ?? ([] as t.ObjectPath);

  // Minimal logging:
  logInfo(`BEGIN`, { scope: pathStr(base), count: errs.length });

  for (const item of errs) {
    const err = item as MutableValidationError;

    // Normalize to absolute path (pure join; no heuristics).
    const rel = (err.path ?? []) as t.ObjectPath;
    const abs = Obj.Path.join(base, rel, 'absolute');
    err.path = abs;

    // Resolve node and copy range/linePos if present.
    const node = Yaml.Path.atPath(ast, abs) as NodeWithRange | undefined;
    if (node?.range) err.range = node.range;
    if (node?.linePos) err.linePos = node.linePos;

    // Per-error log (concise, structured).
    logInfo(`error`, {
      message: err.message,
      rel: pathStr(rel),
      abs: pathStr(abs),
      range: err.range ? rangeStr(err.range) : 'undefined',
    });
  }

  logInfo(`END`);
};
