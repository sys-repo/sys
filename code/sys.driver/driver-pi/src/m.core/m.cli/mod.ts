/**
 * @module
 * Profile-driven CLI entrypoint for the typed Pi Deno boundary.
 */
import { type t } from '../common.ts';
import { Profiles } from '../m.cli.profiles/mod.ts';

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
  await main({ argv: Deno.args });
}
