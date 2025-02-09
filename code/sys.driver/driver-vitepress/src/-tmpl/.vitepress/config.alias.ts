import type { Alias } from 'vite';

import { DenoDeps } from '@sys/driver-deno/runtime';
import { ViteConfig } from '@sys/driver-vite';
import { Err, Path, R } from '@sys/std';

/**
 * Generate "import" statement aliase map for:
 *
 *    - jsr:@sys         System modules within the workspace.
 *    - npm:<deps>       The upstream dependencies imported from the NPM registry.
 */
export async function getAliases() {
  const deps1 = (await loadDeps('./.sys/deps.yaml')).deps;
  const deps2 = (await loadDeps('./.sys/deps.sys.yaml')).deps;
  const modules = [...deps1.map((d) => d.module), ...deps2.map((d) => d.module)];

  const unique = R.uniqBy((item: Alias) => `${item.replacement}:${item.find.toString()}`);
  const aliases = modules
    .filter((m) => m.prefix)
    .filter((m) => m.version !== '0.0.0')
    .map((m) => ViteConfig.alias(m.prefix as 'npm' | 'jsr', m.name));

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
    deps: res.data?.deps ?? [],
    error: errors.toError(),
  } as const;
}
