import { DenoDeps, DenoFile, Err, Path } from './common.ts';
import { rewriteImport } from './task.prep.u.ts';
import { syncPublishedFixture } from './task.prep.u.published.ts';

const SPECIFIER = 'npm:esbuild';
const PATTERN = /from 'npm:esbuild@[^']+'/;

export async function syncTransportLoaderImport(args: { depsPath: string; targetPath: string }) {
  const { depsPath, targetPath } = args;
  const loaded = await DenoDeps.from(depsPath);
  if (loaded.error) throw loaded.error;

  const specifier = DenoDeps.findImport(loaded.data?.deps, SPECIFIER);
  if (!specifier) {
    const cause = new Error(`Source: ${depsPath}`);
    throw Err.std(`Failed to find canonical dependency import: ${SPECIFIER}`, { cause });
  }

  await rewriteImport({
    targetPath,
    pattern: PATTERN,
    replacement: `from '${specifier}'`,
  });
}

export async function main() {
  const ws = await DenoFile.workspace();
  const depsPath = Path.join(ws.dir, 'deps.yaml');
  await syncTransportLoaderImport({
    depsPath,
    targetPath: './src/m.vite.transport/u.load.ts',
  });

  const publishedFixtures = [
    './src/-test/vite.sample-published-baseline',
    './src/-test/vite.sample-published-ui-baseline',
  ] as const;

  for (const dir of publishedFixtures) {
    await syncPublishedFixture({
      rootDenoJson: ws.file,
      dir,
    });
  }
}

if (import.meta.main) await main();
