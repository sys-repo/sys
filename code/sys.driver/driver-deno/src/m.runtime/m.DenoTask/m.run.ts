import { Process, type t } from './common.ts';

/**
 * Run a declared task through `deno task <name>` with inherited terminal stdio.
 */
export async function run(options: t.DenoTask.Run.Options): Promise<t.DenoTask.Run.Result> {
  const output = await Process.inherit({
    cmd: 'deno',
    args: ['task', options.name],
    cwd: options.cwd,
  });
  return { name: options.name, output };
}
