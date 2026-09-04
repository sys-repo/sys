/**
 * @module
 * Profile-driven CLI entrypoint for the typed Pi Deno boundary.
 */
import type { t } from '../common.ts';
import { Profiles } from '../m.cli.profiles/mod.ts';

/**
 * Profile-driven CLI launcher for running Pi as a system agent.
 */
export const Cli: t.PiCliProfiles.Lib = Profiles;

/** Explicit profile-driven aliases. */
export { Profiles };

/**
 * Profile-driven CLI entrypoint that resolves startup state, selects a profile, and launches Pi.
 */
export const main: t.PiCliProfiles.Lib['main'] = Profiles.main;

/**
 * Map only one fully presented GUI failure to a deliberate process status.
 */
export function exitCode(result: t.PiCliProfiles.Result): 0 | 1 {
  return result.kind === 'gui' && result.outcome === 'failed' ? 1 : 0;
}

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  const code = exitCode(await main({ argv: Deno.args }));
  if (code !== 0) Deno.exitCode = code;
}
