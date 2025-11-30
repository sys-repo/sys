import { type t, Is, Obj } from './common.ts';
import { AliasIs } from './m.Is.ts';
import { ensureIsObject } from './u.ts';

type O = Record<string, unknown>;

export const analyze: t.AliasResolverLib['analyze'] = (obj, opts = {}) => {
  const diagnostics: t.Alias.Diagnostic[] = [];

  /**
   * CASE 1: table-only usage
   *
   *   AliasResolver.analyze(aliasTable)
   *
   * - `obj` is treated as the alias table itself for diagnostics.
   * - `resolver.root` is a normalized object view for callers that
   *   want a consistent "root" shape, but that does not affect diagnostics.
   */
  if (!opts.root && !opts.alias) {
    const root = ensureIsObject(obj as O);
    const aliasPath: t.ObjectPath = [];

    // IMPORTANT: analyse the raw input as the table.
    const aliasMap = analyzeTable(obj, aliasPath, diagnostics);

    const resolver: t.Alias.Resolver = { root, alias: aliasMap };
    return { resolver, diagnostics };
  }

  /**
   * CASE 2: document + path usage (unchanged)
   */
  const rootPath: t.ObjectPath = opts.root ?? [];
  const aliasRelPath: t.ObjectPath = opts.alias ?? ['alias'];
  const aliasPath: t.ObjectPath = [...rootPath, ...aliasRelPath];

  const rootLens = Obj.Lens.bind<O>(obj, rootPath);
  const aliasLens = rootLens.at<O>(aliasRelPath);
  const root = ensureIsObject(rootLens.get());

  const aliasRaw = aliasLens.get();
  const aliasMap = analyzeTable(aliasRaw, aliasPath, diagnostics);

  const resolver: t.Alias.Resolver = { root, alias: aliasMap };
  return { resolver, diagnostics };
};

/**
 * Shared table-analysis logic.
 *
 * - Ensures the table is an object (or records a non-object diagnostic).
 * - Validates keys and values.
 * - Produces a clean Alias.Map plus diagnostics.
 */
function analyzeTable(
  aliasRaw: unknown,
  aliasPath: t.ObjectPath,
  diagnostics: t.Alias.Diagnostic[],
): t.Alias.Map {
  const aliasMap: Record<string, string> = {};

  if (!Is.record(aliasRaw)) {
    if (aliasRaw !== undefined) {
      diagnostics.push({
        kind: 'alias:non-object-table',
        path: aliasPath,
        value: aliasRaw,
        message: 'Alias table is not an object; treating as empty map',
      });
    }
    return aliasMap as t.Alias.Map;
  }

  for (const [key, value] of Object.entries(aliasRaw)) {
    const entryPath: t.ObjectPath = [...aliasPath, key];

    if (!AliasIs.aliasKey(key)) {
      diagnostics.push({
        kind: 'alias:invalid-key',
        path: entryPath,
        key,
        value,
        message: `Invalid alias key "${key}" - expected a lowercase alias starting with ":"`,
      });
      continue;
    }

    if (typeof value !== 'string') {
      diagnostics.push({
        kind: 'alias:non-string-value',
        path: entryPath,
        key,
        value,
        message: `Alias "${key}" must map to a string value`,
      });
      continue;
    }

    aliasMap[key] = value;
  }

  return aliasMap as t.Alias.Map;
}
