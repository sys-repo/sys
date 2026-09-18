import { Fs, Testing, Yaml } from '../../-test.ts';
import type { t } from '../common.ts';
import { Cell } from '../mod.ts';
import { CellPaths } from '../u/paths.ts';

export async function catchLoad(root?: t.StringDir): Promise<Error | undefined> {
  try {
    await Cell.load(root);
  } catch (err) {
    return err as Error;
  }
}

export async function tempCell(name: string, yaml: string): Promise<t.StringDir> {
  const fs = await Testing.dir(`cell.${name}`);
  const path = Fs.join(fs.dir, CellPaths.descriptor);
  await Fs.write(path, yaml, { force: true });
  return fs.dir;
}

export async function tempLegacyCell(name: string, yaml: string): Promise<t.StringDir> {
  const fs = await Testing.dir(`cell.legacy.${name}`);
  const path = Fs.join(fs.dir, CellPaths.legacy.descriptor);
  await Fs.write(path, yaml, { force: true });
  return fs.dir;
}

export function sampleRoot(): t.StringDir {
  return new URL('../../../-sample/cell.stripe', import.meta.url).pathname;
}

export async function loadStripeDescriptor(): Promise<unknown> {
  const path = Fs.join(sampleRoot(), CellPaths.descriptor);
  const read = await Fs.readText(path);
  const parsed = Yaml.parse<unknown>(read.data ?? '');
  if (parsed.error) throw parsed.error;
  return parsed.data;
}
