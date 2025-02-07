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
  const deps = (await loadDeps()).deps;
  // console.log('import.meta', import.meta);

  const npm = 'npm';
  const npmRefs = deps.filter((d) => d.module.prefix === npm);
  const npmAliases = npmRefs.map((m) => ViteConfig.alias(npm, m.module.name));

  return [...ws.aliases, ...npmAliases];
  // return [];
}

/**
 * Helpers
 */
async function loadDeps() {
  const errors = Err.errors();
  const path = Path.resolve('./.sys/deps.yaml');
  const res = await DenoDeps.from(path);

  console.log('LOAD DEPS');
  console.log('path', path);
  console.log('res.error', res.error);

  if (res.error || !res.data?.deps) {
    const err = `Failed to load system dependencies from: ${path}`;
    console.warn(err, { cause: res.error });
    errors.push(err);
  }

  const deps = res.data?.deps ?? [];
  return { deps, error: errors.toError() };
}
