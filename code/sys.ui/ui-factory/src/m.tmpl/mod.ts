/**
 * @module
 * File-system templates for `@sys/ui-factory`.
 */

import { Args, makeBundle } from './common.ts';
import { cli } from './u.cli.ts';

export { cli };
export default cli;

/**
 * Command-line:
 */
if (import.meta.main) {
  type A = { bundle?: boolean; dryRun?: boolean; force?: boolean };
  const { bundle, dryRun, force } = Args.parse<A>(Deno.args);

  if (bundle) makeBundle();
  else cli({ dryRun, force });
}
