import { DenoDeps, DenoFile, Err, Fs, Path } from './common.ts';

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

  const path = Path.resolve(targetPath);
  const text = await Deno.readTextFile(path);
  const next = text.replace(PATTERN, `from '${specifier}'`);

  if (text === next) return;
  await Fs.write(path, next);
}

export async function main() {
  const ws = await DenoFile.workspace();
  const depsPath = Path.join(ws.dir, 'deps.yaml');
  const targetPath = './src/m.vite.transport/u.load.ts';
  await syncTransportLoaderImport({ depsPath, targetPath });
}

/**
 * Main entry:
 */
if (import.meta.main) await main();
