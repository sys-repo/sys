import { Fs, Yaml } from '../../-test.ts';
import type { t } from '../common.ts';
import { Cell } from '../mod.ts';

export async function catchLoad(root: t.StringDir): Promise<Error | undefined> {
  try {
    await Cell.load(root);
  } catch (err) {
    return err as Error;
  }
}

export async function tempCell(name: string, yaml: string): Promise<t.StringDir> {
  const root = Fs.resolve(`./.tmp/cell.load/${name}`) as t.StringDir;
  const path = Fs.join(root, '-config/@sys.cell/cell.yaml');
  await Fs.write(path, yaml, { force: true });
  return root;
}

export function sampleRoot(): t.StringDir {
  return new URL('../../../-sample/cell.stripe', import.meta.url).pathname;
}

export async function loadStripeDescriptor(): Promise<unknown> {
  const path = Fs.join(sampleRoot(), '-config/@sys.cell/cell.yaml');
  const read = await Fs.readText(path);
  const parsed = Yaml.parse<unknown>(read.data ?? '');
  if (parsed.error) throw parsed.error;
  return parsed.data;
}
