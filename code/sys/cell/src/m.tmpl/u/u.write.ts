import { Fs, type t } from '../common.ts';
import type { CellTmpl } from '../t.ts';
import { makeTmpl } from './u.make.ts';

export async function writeTmpl(
  name: CellTmpl.Name,
  target: string,
  options: CellTmpl.Write.Options = {},
): Promise<CellTmpl.Write.Result> {
  const targetDir = Fs.resolve(target);
  const dryRun = options.dryRun === true;
  const res = await makeTmpl(name).write(targetDir as t.StringDir, { dryRun });

  return { target: targetDir, dryRun, ops: res.ops, total: res.total };
}
