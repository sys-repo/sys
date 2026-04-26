import { DenoDeps, DenoFile } from '@sys/driver-deno/runtime';
import { Fs, Path } from '@sys/fs';
import { Err } from '@sys/std/error';

const SPECIFIER_REACT_SPINNERS = 'npm:react-spinners';
const PATTERN_REACT_SPINNERS = /import\('npm:react-spinners@[^']+'\)/;

export async function main() {
  const ws = await DenoFile.workspace();
  const depsPath = Path.join(ws.dir, 'deps.yaml');
  const loaded = await DenoDeps.from(depsPath);
  if (loaded.error) throw loaded.error;

  const resolved = DenoDeps.findImport(loaded.data?.deps, SPECIFIER_REACT_SPINNERS);
  if (!resolved) {
    const cause = new Error(`Source: ${depsPath}`);
    throw Err.std(`Failed to find canonical dependency import: ${SPECIFIER_REACT_SPINNERS}`, { cause });
  }

  await rewriteImport({
    targetPath: './src/ui/Spinners.Bar/u.loader.ts',
    pattern: PATTERN_REACT_SPINNERS,
    replacement: `import('${resolved}/BarLoader.js')`,
  });
}

if (import.meta.main) await main();

async function rewriteImport(args: {
  targetPath: string;
  pattern: RegExp;
  replacement: string;
}) {
  const { targetPath, pattern, replacement } = args;
  const path = Path.resolve(targetPath);
  const text = (await Fs.readText(path)).data;
  if (typeof text !== 'string') return;

  const next = text.replace(pattern, replacement);
  if (text === next) return;

  await Fs.write(path, next);
}
