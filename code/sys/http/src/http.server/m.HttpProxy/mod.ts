/**
 * @module
 * Reverse proxy with exact method-and-path routes, prefix mounts, and root fallback.
 *
 * An exact route forwards a nonempty query string to its fixed target. A bare `?` is omitted.
 */
export { HttpProxy } from './m/m.HttpProxy.ts';

if (import.meta.main) {
  const { cli } = await import('./m.cli/mod.ts');
  Deno.exit(await cli(Deno.cwd(), Deno.args));
}
