import { Cell } from '../../m.cell/mod.ts';
import { CellPaths } from '../../m.cell/u/paths.ts';
import { Fs, type t } from '../common.ts';

export async function canonicalRoot(root: string): Promise<t.StringDir> {
  const real = await Fs.realPath(root);
  return real as t.StringDir;
}

export async function loadCanonicalRoot(input?: string): Promise<t.StringDir> {
  if (input) return await canonicalRoot((await Cell.load(input)).root);

  const found = await Fs.findAncestor(Fs.cwd('process'), async ({ dir }) => {
    return (await isCellRoot(dir)) ? dir : undefined;
  });
  if (!found) throw new Error('Cell kill: failed to find a Cell root from the current directory.');

  return await canonicalRoot((await Cell.load(found)).root);
}

async function isCellRoot(dir: string) {
  const canonical = Fs.join(dir, CellPaths.descriptor);
  const legacy = Fs.join(dir, CellPaths.legacy.descriptor);
  return (await Fs.exists(canonical)) || (await Fs.exists(legacy));
}
