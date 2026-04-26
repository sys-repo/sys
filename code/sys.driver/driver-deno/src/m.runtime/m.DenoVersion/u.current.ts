import { type t } from './common.ts';
import { parseCurrentVersion } from './u.parse.ts';
import { fail, invoke, ok, type Deps } from './u.shared.ts';

export async function get(
  input: t.DenoVersion.Input = {},
  deps: Deps = {},
): Promise<t.DenoVersion.Current.Result> {
  try {
    const output = await invoke(input, ['--version'], deps);
    if (!output.success) {
      return fail('Failed to resolve local Deno runtime version.', output);
    }

    const version = parseCurrentVersion(output);
    if (!version) {
      return fail('Deno runtime version output could not be parsed.', output);
    }

    return ok({ version, output });
  } catch (cause) {
    return fail('Failed to resolve local Deno runtime version.', cause);
  }
}

export const getLib: t.DenoVersion.Current.Lib['get'] = get;
