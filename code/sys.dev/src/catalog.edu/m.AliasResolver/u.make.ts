import { type t, Is, Obj, Lazy } from './common.ts';
import { AliasIs } from './m.Is.ts';

type O = Record<string, unknown>;

export const make: t.AliasResolverLib['make'] = (obj, opts = {}) => {
  const rootLens = Obj.Lens.bind<O>(obj, opts.root ?? []);
  const aliasLens = rootLens.at<O>(opts.alias ?? ['alias']);

  const root = Lazy.memo(() => ensureIsObject(rootLens.get()));
  const alias = Lazy.memo(() => cleanMap(aliasLens.get()));

  const api: t.Alias.Resolver = {
    get root() {
      return root.value;
    },
    get alias() {
      return alias.value;
    },
  };

  return api;
};

/**
 * Helpers:
 */
function ensureIsObject(input?: O): O {
  if (!input) return {};
  if (!Is.record(input)) return {};
  return input;
}

function cleanMap(input?: O): t.Alias.Map {
  const obj = ensureIsObject(input);
  const out: Record<string, string> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (!AliasIs.aliasKey(key)) continue;
    if (typeof value !== 'string') continue;
    out[key] = value;
  }

  return out as t.Alias.Map;
}
