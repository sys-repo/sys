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
  // const ws = await ViteConfig.workspace({});
  const deps1 = (await loadDeps('./.sys/sys.yaml')).deps;
  const deps2 = (await loadDeps('./.sys/sys.deps.yaml')).deps;

  // console.log('import.meta', import.meta);

  const modules = [...deps1.map((d) => d.module), ...deps2.map((d) => d.module)];

  const npm = 'npm';
  const npmRefs = modules.filter((d) => d.prefix === npm);
  const npmAliases = npmRefs.map((m) => ViteConfig.alias(npm, m.name));

  console.log('[...npmAliases]', [...npmAliases]);

  // return [];
  return [...npmAliases];
}

/**
 * Helpers
 */
async function loadDeps(path: string) {
  const errors = Err.errors();

  path = Path.resolve(import.meta.dirname ?? '', '..', path);
  console.log('path', path);
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
