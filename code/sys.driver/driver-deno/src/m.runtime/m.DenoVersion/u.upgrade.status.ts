import { type t } from './common.ts';
import { parseUpgradeStatus } from './u.parse.ts';
import { fail, invoke, ok, type Deps } from './u.shared.ts';

export async function status(
  input: t.DenoVersion.Input = {},
  deps: Deps = {},
): Promise<t.DenoVersion.Upgrade.StatusResult> {
  try {
    const output = await invoke(input, ['upgrade', '--dry-run'], deps);
    if (!output.success) {
      return fail('Failed to resolve Deno runtime upgrade status.', output);
    }

    const data = parseUpgradeStatus(output);
    if (!data) {
      return fail('Deno runtime upgrade status output could not be parsed.', output);
    }

    return ok(data);
  } catch (cause) {
    return fail('Failed to resolve Deno runtime upgrade status.', cause);
  }
}

export const statusLib: t.DenoVersion.Upgrade.Lib['status'] = status;
