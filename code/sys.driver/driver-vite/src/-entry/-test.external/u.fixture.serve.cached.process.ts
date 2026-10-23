import { ViteEntry } from '../mod.ts';

const READY_PREFIX = 'driver-vite-entry-serve-ready:';
const encoder = new TextEncoder();
const original = Deno.serve;
const serve = ((...args: unknown[]) => {
  const server = Reflect.apply(original, Deno, args) as Deno.HttpServer;
  const addr = server.addr;
  if (addr.transport !== 'tcp') throw new Error('Deno.serve did not bind TCP.');

  const { hostname, port } = addr;
  Deno.stdout.writeSync(encoder.encode(`${READY_PREFIX}${hostname}:${port}\n`));
  return server;
}) as typeof Deno.serve;
(Deno as { serve: typeof Deno.serve }).serve = serve;

await ViteEntry.main(Deno.args);
