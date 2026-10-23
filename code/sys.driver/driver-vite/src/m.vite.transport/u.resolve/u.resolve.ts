import { Process, type t } from '../common.ts';
import { resolveNpmPath, resolveNpmPathWith } from './u.npmPath.ts';
import { createResolvePlugin as createResolvePluginWithDeps } from './u.plugin.ts';

const depsDefault: t.ResolveDeps = { invoke: Process.invoke, resolveNpmPath };

export { resolveNpmPath, resolveNpmPathWith } from './u.npmPath.ts';
export { resolveViteSpecifier } from './u.vite.ts';

export function createResolvePlugin(
  cache: t.DenoCache,
  deps: t.ResolveDeps = depsDefault,
  options?: t.ViteTransport.DenoPluginOptions,
) {
  return createResolvePluginWithDeps(cache, deps, options);
}
