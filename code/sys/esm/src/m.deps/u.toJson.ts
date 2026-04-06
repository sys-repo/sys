import { type t } from './common.ts';
import { toDenoJson } from './u.toJson.deno.ts';
import { toPackageJson } from './u.toJson.package.ts';

/**
 * Render canonical dependency entries to the requested JSON surface.
 */
export const toJson = (kind: t.EsmDeps.TargetFile, entries?: t.EsmDeps.Entry[]) => {
  if (kind === 'deno.json') return toDenoJson(entries);
  if (kind === 'package.json') return toPackageJson(entries);
  throw new Error(`Unsupported JSON kind flag: "${kind}"`);
};

export { toDenoJson, toPackageJson };
