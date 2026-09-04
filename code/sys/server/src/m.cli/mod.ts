/**
 * @module
 * Server package help/DSL CLI.
 */
import { ServerCli } from './m.ServerCli.ts';

export { ServerCli };

/**
 * Main entry:
 */
if (import.meta.main) {
  const res = await ServerCli.run({ argv: Deno.args });
  if (res.kind === 'error') Deno.exitCode = res.code;
}
