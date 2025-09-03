/**
 * @module
 * File-system templates for `@sys/ui-factory`.
 */

import { Args, makeBundle } from './common.ts';
import { cli, type CliArgs } from './u.cli.ts';

export { cli };
export default cli;

/**
 * Command-line:
 */
if (import.meta.main) {
  const { bundle, dryRun, force } = Args.parse<CliArgs>(Deno.args);
  if (bundle) makeBundle();
  else cli({ dryRun, force });
}
