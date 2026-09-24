/**
 * @module
 * Profile-driven CLI entrypoint for the typed Pi Deno boundary.
 */
import type { t } from '../common.ts';
import { Profiles } from './m.profiles/mod.ts';

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
 * Preserve the process owner's child code and the presented GUI failure status.
 */
export function exitCode(result: t.PiCliProfiles.Result): number {
  if (result.kind === 'run') return result.output.code;
  return result.kind === 'gui' && result.outcome === 'failed' ? 1 : 0;
}

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  const code = exitCode(await main({ argv: Deno.args }));
  if (code !== 0) Deno.exitCode = code;
}
