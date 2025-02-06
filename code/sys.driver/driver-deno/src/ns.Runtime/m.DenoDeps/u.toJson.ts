import { type t } from './common.ts';
import { toDenoJson } from './u.toJson.deno.ts';
import { toPackageJson } from './u.toJson.package.ts';

export { toDenoJson, toPackageJson };

/**
 * Wrangler: toJson
 */
export const toJson = (kind: t.DenoDepTargetFile, deps?: t.DenoDep[]) => {
  if (kind === 'deno.json') return toDenoJson(deps);
  if (kind === 'package.json') return toPackageJson(deps);
  throw new Error(`Unsupported JSON kind flag: "${kind}"`);
};
