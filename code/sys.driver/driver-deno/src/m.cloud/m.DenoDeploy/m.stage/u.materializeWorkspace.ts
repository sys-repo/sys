import { type t, Fs } from './common.ts';

export async function materializeWorkspace(source: t.StringDir, root: t.StringDir): Promise<void> {
  const res = await Fs.copyDir(source, root, { force: await Fs.exists(root) });
  if (res.error) throw res.error;
}
