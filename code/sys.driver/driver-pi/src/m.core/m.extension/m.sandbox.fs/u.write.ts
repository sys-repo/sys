import { type t } from './common.ts';
import { makeTmpl } from './u.make.ts';
import { SandboxFsPaths } from './u.paths.ts';

/** Materialize the generated sandbox filesystem Pi extension. */
export async function writeExtension(
  input: t.PiSandboxFsExtension.WriteInput,
): Promise<t.PiSandboxFsExtension.WriteResult> {
  const targetDir = SandboxFsPaths.dirOf(input.cwd);
  const path = SandboxFsPaths.pathOf(input.cwd);
  const res = await makeTmpl(input.policy).write(targetDir, {
    dryRun: input.dryRun === true,
    force: true,
  });

  return {
    path,
    args: ['--extension', path],
    policy: input.policy,
    ops: res.ops,
    total: res.total,
  };
}
