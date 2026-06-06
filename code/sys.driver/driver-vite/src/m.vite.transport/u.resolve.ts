import { Process, type t } from './common.ts';
import { resolveDenoWith } from './u.resolve.denoInfo.ts';
import { resolveNpmPath, resolveNpmPathWith } from './u.resolve.npmPath.ts';
import { createResolvePlugin as createResolvePluginWithDeps } from './u.resolve.plugin.ts';

const memoDefault: t.ResolveMemo = { inflight: new Map(), settled: new Map(), alias: new Map() };
const depsDefault: t.ResolveDeps = { invoke: Process.invoke, resolveNpmPath, memo: memoDefault };

export { resolveDenoWith } from './u.resolve.denoInfo.ts';
export { resolveNpmPath, resolveNpmPathWith } from './u.resolve.npmPath.ts';
export { resolveViteSpecifier } from './u.resolve.vite.ts';

export function createResolvePlugin(cache: t.DenoCache, deps: t.ResolveDeps = depsDefault) {
  return createResolvePluginWithDeps(cache, deps);
}

export async function resolveDeno(id: string, cwd: string): Promise<t.DenoResolved | null> {
  return await resolveDenoWith(id, cwd, depsDefault);
}
