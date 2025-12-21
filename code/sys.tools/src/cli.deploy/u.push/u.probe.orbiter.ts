import { type t, Process } from '../common.ts';

/**
 * Probe whether `orbiter` is runnable in the current environment.
 *
 * - Attempts a tiny command (`--version`) to minimize cost.
 * - Does not parse output.
 * - Never throws.
 */
export async function probeOrbiter(
  options: {
    /** Binary name (defaults to "orbiter"). */
    readonly cmd?: string;
    /** Optional working dir for the probe. */
    readonly cwd?: t.StringDir;
  } = {},
): Promise<t.OrbiterAvailability> {
  const cmd = String(options.cmd ?? 'orbiter');

  try {
    // Cheapest possible capability probe.
    await Process.invoke({
      cmd,
      args: ['--version'],
      cwd: options.cwd,
      silent: true,
    });

    return { ok: true };
  } catch (error) {
    // Deno will typically throw if the executable cannot be found or launched.
    // Keep this coarse; callers decide how to message/install-help.
    return {
      ok: false,
      reason: 'not-found',
      hint: `Missing required binary: ${cmd}`,
      error,
    };
  }
}
