import type { Alias } from 'vite';

import { DenoDeps } from '@sys/driver-deno/runtime';
import { ViteConfig } from '@sys/driver-vite';
import { Err, Path, R } from '@sys/std';

/**
 * Generate "import" statement alias map for:
 *
 *    - jsr:@sys         System modules within the workspace.
 *    - npm:<deps>       The upstream dependencies imported from the NPM registry.
 */
export async function getAliases() {
  const deps = (await loadDeps('./.sys/deps.yaml')).deps;
  const depsSys = (await loadDeps('./.sys/deps.sys.yaml')).deps;

  const isSys = (name: string) => name.startsWith('@sys/');
  const ws = await ViteConfig.workspace();
  const a = depsSys.map((m) => m.name).filter(isSys);
  const b = ws.modules.items.map((m) => m.name).filter(isSys);
  const isSystemMonorepo = a.every((item) => b.includes(item));
  if (isSystemMonorepo) return ws.aliases;

  const modules = [...deps, ...depsSys];
  const aliases = modules
    .filter((m) => !!m.registry)
    .filter((m) => m.version !== '0.0.0')
    .map((m) => ViteConfig.alias(m.registry, m.name));

  const unique = R.uniqBy((item: Alias) => `${item.replacement}:${item.find.toString()}`);
  return unique(aliases);
}

/**
 * Helpers
 */
async function loadDeps(path: string) {
  const errors = Err.errors();
  path = Path.resolve(import.meta.dirname ?? '', '..', path);

  const res = await DenoDeps.from(path);
  if (res.error || !res.data?.deps) {
    const err = `Failed to load system dependencies from: ${path}`;
    console.warn(err, { cause: res.error });
    errors.push(err);
  }

  return {
    deps: (res.data?.deps ?? []).map((d) => d.module),
    error: errors.toError(),
  } as const;
}
