import type { Alias } from 'vite';

import { DenoDeps } from '@sys/driver-deno/runtime';
import { ViteConfig } from '@sys/driver-vite';
import { Err, Path } from '@sys/std';

/**
 * Generate "import" statement aliase map for:
 *
 *    - jsr:@sys         System modules within the workspace.
 *    - npm:<deps>       The upstream dependencies imported from the NPM registry.
 */
export async function getAliases() {
  const ws = await ViteConfig.workspace({});
  const deps = (await loadDeps(ws.dir)).deps;
  const npmRefs = deps.filter((d) => d.module.prefix === 'npm');
  const npmAliases = npmRefs.map((m) => toAlias(m.module.name));
  return [...ws.aliases, ...npmAliases];
}

/**
 * Helpers
 */
async function loadDeps(dir: string) {
  const errors = Err.errors();
  const path = Path.join(dir, 'deps.yaml');
  const res = await DenoDeps.from(path);

  if (res.error || !res.data?.deps) {
    const err = `Failed to load system dependencies from: ${path}`;
    console.warn(err, { cause: res.error });
    errors.push(err);
  }

  const deps = res.data?.deps ?? [];
  return { deps, error: errors.toError() };
}


/**
 * Match: "npm:<module-name>@<semver>"
 */
export function toAliasRegex(moduleName: string): RegExp {
  const name = moduleName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // NB: Escape any special regex characters.
  return new RegExp(`^npm:${name}@(\\d+\\.\\d+\\.\\d+)(?:-[\\w.]+)?$`);
}

export function toAlias(moduleName: string): Alias {
  const find = toAliasRegex(moduleName);
  return { find, replacement: moduleName };
}
