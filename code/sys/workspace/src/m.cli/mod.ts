/**
 * @module
 * CLI entrypoints for workspace tooling.
 */
import { WorkspaceCli } from './m.Cli.ts';

export { WorkspaceCli };

/**
 * Main entry:
 */
if (import.meta.main) {
  await WorkspaceCli.run({ argv: Deno.args });
}
