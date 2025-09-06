/**
 * @module
 * File-system templates for `@sys/ui-factory`.
 */
import { Args, makeBundle } from './common.ts';
export { cli, run, type RunResult } from './u.cli.ts';

/**
 * Command-line:
 */
if (import.meta.main) {
  type A = { bundle?: boolean; dryRun?: boolean; force?: boolean };
  const { bundle, dryRun, force } = Args.parse<A>(Deno.args);
  if (bundle) {
    await makeBundle();
  } else {
    const { cli } = await import('./u.cli.ts');
    await cli({ dryRun, force });
  }
}
