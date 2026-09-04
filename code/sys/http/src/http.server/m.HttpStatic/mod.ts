/**
 * @module
 * Static HTTP server lifecycle endpoint.
 */
export { HttpStatic } from './m.HttpStatic.ts';

if (import.meta.main) {
  const { cli } = await import('./m.cli.ts');
  Deno.exit(await cli(Deno.cwd(), Deno.args));
}
