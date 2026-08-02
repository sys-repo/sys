/**
 * @module
 * Reverse proxy for root-site and mounted upstream passthrough.
 */
export { HttpProxy } from './m/m.HttpProxy.ts';

if (import.meta.main) {
  const { cli } = await import('./m.cli/mod.ts');
  Deno.exit(await cli(Deno.cwd(), Deno.args));
}
