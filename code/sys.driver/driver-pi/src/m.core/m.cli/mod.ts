/**
 * @module
 * Profile-driven CLI entrypoint for the typed Pi Deno boundary.
 */
import { type t } from '../common.ts';
import { Profiles } from '../m.cli.profiles/mod.ts';
import { settleCliRun } from '../m.cli.profiles/u/u.start.gui.settlement.ts';

/** Profile-driven CLI launcher for running Pi as a system agent. */
export const Cli: t.PiCliProfiles.Lib = Profiles;

/** Explicit profile-driven aliases. */
export { Profiles };

/**
 * Profile-driven CLI entrypoint that resolves startup state, selects a profile, and launches Pi.
 */
export const main: t.PiCliProfiles.Lib['main'] = Profiles.main;

/**
 * CLI entry-point:
 */
if (import.meta.main) {
  const exitCode = await settleCliRun(() => main({ argv: Deno.args }));
  if (exitCode !== 0) Deno.exitCode = exitCode;
}
