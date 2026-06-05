import { DenoDeps, DenoFile, Err, Path } from './common.ts';
import { rewriteImport } from './task.prep.u.ts';
import { syncPublishedFixture } from './task.prep.u.published.ts';

const SPECIFIER_DENO_LOADER = 'jsr:@deno/loader';
const PATTERN_DENO_LOADER_VERSION = /const DENO_LOADER_VERSION = '[^']+'/;
const SPECIFIER_VITE_PLUGIN_WASM = 'npm:vite-plugin-wasm';
const PATTERN_VITE_PLUGIN_WASM = /import\('npm:vite-plugin-wasm@[^']+'\)/;
const PACKAGE_DIR = Path.dirname(Path.dirname(Path.fromFileUrl(import.meta.url)));
export const PUBLISHED_FIXTURE_DIRS = [
  Path.join(PACKAGE_DIR, 'src/-test/vite.sample-published-baseline'),
  Path.join(PACKAGE_DIR, 'src/-test/vite.sample-published-ui-baseline'),
  Path.join(PACKAGE_DIR, 'src/-test/vite.sample-published-ui-components'),
] as const;

export async function syncTransportLoaderVersion(args: { depsPath: string; targetPath: string }) {
  await syncPinnedImport({
    depsPath: args.depsPath,
    targetPath: args.targetPath,
    specifier: SPECIFIER_DENO_LOADER,
    pattern: PATTERN_DENO_LOADER_VERSION,
    replacement: (resolved) => `const DENO_LOADER_VERSION = '${wrangle.denoLoaderVersion(resolved)}'`,
  });
}

export async function syncWasmPluginImport(args: { depsPath: string; targetPath: string }) {
  await syncPinnedImport({
    depsPath: args.depsPath,
    targetPath: args.targetPath,
    specifier: SPECIFIER_VITE_PLUGIN_WASM,
    pattern: PATTERN_VITE_PLUGIN_WASM,
    replacement: (resolved) => `import('${resolved}')`,
  });
}

export async function main() {
  const ws = await DenoFile.workspace();
  const depsPath = Path.join(ws.dir, 'deps.yaml');
  await syncTransportLoaderVersion({
    depsPath,
    targetPath: './src/m.vite.transport/u.cache.ts',
  });
  await syncWasmPluginImport({
    depsPath,
    targetPath: './src/m.vite.config/u.plugins.ts',
  });

  for (const dir of PUBLISHED_FIXTURE_DIRS) {
    await syncPublishedFixture({
      rootDenoJson: ws.file,
      dir,
    });
  }
}

async function syncPinnedImport(args: {
  depsPath: string;
  targetPath: string;
  specifier: string;
  pattern: RegExp;
  replacement: (specifier: string) => string;
}) {
  const { depsPath, targetPath, specifier, pattern, replacement } = args;
  const loaded = await DenoDeps.from(depsPath);
  if (loaded.error) throw loaded.error;

  const resolved = DenoDeps.findImport(loaded.data?.deps, specifier);
  if (!resolved) {
    const cause = new Error(`Source: ${depsPath}`);
    throw Err.std(`Failed to find canonical dependency import: ${specifier}`, { cause });
  }

  await rewriteImport({
    targetPath,
    pattern,
    replacement: replacement(resolved),
  });
}

const wrangle = {
  denoLoaderVersion(specifier: string) {
    const match = specifier.match(/^jsr:@deno\/loader@([^/]+)$/);
    if (match?.[1]) return match[1];
    throw Err.std(`Failed to derive @deno/loader version from canonical import: ${specifier}`);
  },
} as const;

if (import.meta.main) await main();
