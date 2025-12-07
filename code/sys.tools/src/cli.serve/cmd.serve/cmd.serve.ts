import { type t, D, Http, Net } from '../common.ts';
import { Mime } from './u.mime.ts';
import { route } from './u.serve.route.ts';

type Opts = { port?: number };

/**
 * Start a local HTTP server for the given directory.
 */
export async function startServing(
  cwd: t.StringDir,
  location: t.ServeTool.DirConfig,
  opts: Opts = {},
): Promise<void> {
  const { dir, contentTypes } = location;

  /**
   * Map extensions → MIME types (subset of ServeType).
   */
  const mimeByExt = Mime.extensionMap;
  const app = Http.Server.create({ static: false });

  // Pass the readonly MimeType[] directly to the route factory.
  app.use('*', route({ dir, contentTypes }));

  // Static middleware with restricted MIME table.
  const allowedMimes = new Set<string>(contentTypes);
  const staticMimes: Record<string, string> = Object.fromEntries(
    Object.entries(mimeByExt).filter(([, mime]) => allowedMimes.has(mime)),
  );

  app.use('*', Http.Server.static({ root: dir, mimes: staticMimes }));

  console.info();
  const port = Net.port(opts.port ?? D.port);
  const baseOptions = Http.Server.options({ port, dir, silent: false });
  const ac = new AbortController();
  const server = Deno.serve({ ...baseOptions, signal: ac.signal }, app.fetch);

  // Block here until the keyboard helper decides we're done.
  await Http.Server.keyboard({
    port,
    print: true,
    async dispose() {
      ac.abort();
      await server.finished;
    },
  });
}
