import { type t, Process } from '../../common.ts';

/**
 * Probe whether `orbiter` is runnable in the current environment.
 *
 * - Attempts a tiny command (`--version`) to minimize cost.
 * - Does not parse output.
 * - Never throws.
 */
export async function probe(
  options: {
    readonly cmd?: string; //       Binary name (defaults to "orbiter").
    readonly cwd?: t.StringDir; //  Optional working dir for the probe.
  } = {},
): Promise<t.ProviderAvailability> {
  const { cwd, cmd = 'orbiter' } = options;
  const hint = 'npm i -g orbiter-cli';

  try {
    // Cheapest possible capability probe.
    const out = await Process.invoke({ cmd, args: ['--version'], cwd, silent: true });
    if (!out.success) {
      return { ok: false, reason: 'failed', hint, error: out };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, reason: 'not-found', hint, error };
  }
}
