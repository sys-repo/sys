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

  const npm = 'npm';
  const npmRefs = deps.filter((d) => d.module.prefix === npm);
  const npmAliases = npmRefs.map((m) => ViteConfig.alias(npm, m.module.name));

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
