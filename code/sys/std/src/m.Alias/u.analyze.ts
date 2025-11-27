import { type t, Is, Obj } from './common.ts';
import { AliasIs } from './m.Is.ts';
import { ensureIsObject } from './u.ts';

type O = Record<string, unknown>;

export const analyze: t.AliasResolverLib['analyze'] = (obj, opts = {}) => {
  const rootPath: t.ObjectPath = opts.root ?? [];
  const aliasRelPath: t.ObjectPath = opts.alias ?? ['alias'];
  const aliasPath: t.ObjectPath = [...rootPath, ...aliasRelPath];

  const diagnostics: t.Alias.Diagnostic[] = [];
  const rootLens = Obj.Lens.bind<O>(obj, rootPath);
  const aliasLens = rootLens.at<O>(aliasRelPath);
  const root = ensureIsObject(rootLens.get());

  const aliasRaw = aliasLens.get();
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
  } else {
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
  }

  const resolver: t.Alias.Resolver = { root, alias: aliasMap satisfies t.Alias.Map };
  return {
    resolver,
    diagnostics,
  };
};

/**
 * Helpers:
 */
