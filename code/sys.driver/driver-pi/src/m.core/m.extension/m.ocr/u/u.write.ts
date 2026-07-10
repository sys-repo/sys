import { Fs, type t } from '../common.ts';
import { makeTmpl } from './u.make.ts';
import { extensionFile } from './u.paths.ts';

export async function write(
  input: t.PiOcrExtension.WriteInput,
): Promise<t.PiOcrExtension.WriteResult> {
  const cwd = Fs.resolve(input.cwd);
  const path = extensionFile(cwd);
  const result = await makeTmpl(input.policy).write(Fs.dirname(path), {
    dryRun: input.dryRun === true,
    force: true,
  });

  return {
    path,
    args: ['--extension', path],
    policy: input.policy,
    ops: result.ops,
    total: result.total,
  };
}
