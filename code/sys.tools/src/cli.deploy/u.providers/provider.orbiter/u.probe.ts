import { type t, Process } from '../../common.ts';

/**
 * Probe whether `orbiter` is runnable in the current environment.
 *
 * - Attempts a tiny command (`--version`) to minimize cost.
 * - Does not parse output.
 * - Never throws.
 */
export async function probe(cwd: t.StringDir): Promise<t.ProviderAvailability> {
  const hint = 'deno x npm:orbiter-cli';
  try {
    // Cheapest possible capability probe.
    const out = await Process.invoke({
      cmd: 'deno',
      args: ['x', 'npm:orbiter-cli', '--version'],
      cwd,
      silent: true,
    });

    if (!out.success) {
      return { ok: false, reason: 'failed', hint, error: out };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, reason: 'not-found', hint, error };
  }
}
