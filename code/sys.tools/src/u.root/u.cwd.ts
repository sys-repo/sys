import { type t } from './common.ts';

/**
 * Resolve the shell directory that invoked the CLI.
 *
 * `INIT_CWD` is a package-runner convention used to preserve the user's
 * original terminal directory when a command delegates through another process.
 * Keep this root-local to avoid loading the full filesystem package before the
 * first menu render.
 */
export function terminalCwd(): t.StringDir {
  return Deno.env.get('INIT_CWD') ?? Deno.cwd();
}
