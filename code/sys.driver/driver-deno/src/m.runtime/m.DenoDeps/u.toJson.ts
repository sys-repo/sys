import { type t } from './common.ts';
import { toDenoJson } from './u.toJson.deno.ts';
import { toPackageJson } from './u.toJson.package.ts';

export { toDenoJson, toPackageJson };

/**
 * Wrangler: toJson
 */
export function toJson(kind: 'deno.json', deps?: t.DenoDeps.Dep[]): t.PkgDenoJson;
export function toJson(kind: 'package.json', deps?: t.DenoDeps.Dep[]): t.PkgNodeJson;
export function toJson(kind: t.DenoDeps.TargetFile, deps?: t.DenoDeps.Dep[]) {
  if (kind === 'deno.json') return toDenoJson(deps);
  if (kind === 'package.json') return toPackageJson(deps);
  throw new Error(`Unsupported JSON kind flag: "${kind}"`);
}
