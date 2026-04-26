import { type t } from './common.ts';
import { parseUpgradeRun } from './u.parse.ts';
import { fail, invoke, ok, toUpgradeArgs, type Deps } from './u.shared.ts';

export async function run(
  input: t.DenoVersion.Upgrade.Input = {},
  deps: Deps = {},
): Promise<t.DenoVersion.Upgrade.RunResult> {
  try {
    const output = await invoke(input, toUpgradeArgs(input), deps);
    if (!output.success) {
      return fail('Deno runtime upgrade command failed.', output);
    }

    return ok(parseUpgradeRun(output, { dryRun: input.dryRun === true }));
  } catch (cause) {
    return fail('Deno runtime upgrade command failed.', cause);
  }
}

export const runLib: t.DenoVersion.Upgrade.Lib['run'] = run;
