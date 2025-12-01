import { type t, HttpServer, Net } from '../common.ts';
import { Mime } from './u.mime.ts';
import { route } from './u.serve.route.ts';

export async function startServing(location: t.ServeDirConfig): Promise<void> {
  const { dir, contentTypes } = location;

  /**
   * Map extensions → MIME types (subset of ServeType).
   */
  const mimeByExt = Mime.extensionMap;
  const app = HttpServer.create({ static: false });

  // Pass the readonly MimeType[] directly to the route factory.
  app.use('*', route({ dir, contentTypes }));

  // Static middleware with restricted MIME table.
  const allowedMimes = new Set<string>(contentTypes);
  const staticMimes: Record<string, string> = Object.fromEntries(
    Object.entries(mimeByExt).filter(([, mime]) => allowedMimes.has(mime)),
  );

  app.use('*', HttpServer.static({ root: dir, mimes: staticMimes }));

  console.info();
  const port = Net.port(3000);
  const baseOptions = HttpServer.options({ port, dir, silent: false });
  const ac = new AbortController();
  const server = Deno.serve({ ...baseOptions, signal: ac.signal }, app.fetch);

  // Block here until the keyboard helper decides we're done.
  await HttpServer.keyboard({
    port,
    print: true,
    dispose: async () => {
      ac.abort();
      await server.finished;
    },
  });
}
