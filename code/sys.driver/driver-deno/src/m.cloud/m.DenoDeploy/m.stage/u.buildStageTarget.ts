import { D, type t, Process, Str } from './common.ts';

export async function buildStageTarget(targetDir: t.StringDir) {
  const build = await Process.invoke({
    cmd: D.denoCommand,
    args: ['task', 'build'],
    cwd: targetDir,
    silent: true,
  });

  if (!build.success) {
    throw new Error(Str.dedent(`
      DenoDeploy.stage: build failed for staged target '${targetDir}' (code ${build.code}).

      stdout:
      ${build.text.stdout}

      stderr:
      ${build.text.stderr}
    `));
  }
}
