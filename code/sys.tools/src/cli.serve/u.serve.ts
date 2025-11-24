import { type t, D, Fs, Str, HttpServer, Net } from './common.ts';

export async function startServing(location: t.ServeConfigLocation): Promise<void> {
  const { dir, types } = location;

  /**
   * Map extensions → MIME types (subset of ServeType).
   */
  const mimeByExt = D.mime.extensionMap;
  const allowedMimes = new Set<string>(types);
  const app = HttpServer.create({ static: false });

  app.use('*', async (c) => {
    const reqPath = c.req.path;

    // Normalise, trim leading slash.
    const rel = reqPath.startsWith('/') ? reqPath.slice(1) : reqPath;
    const filePath = `${dir}/${rel}`;

    const notFound = () => {
      const str = Str.builder().line('404 - Not found').line(`Serving from ${dir}`);
      return String(str);
    };

    const stat = await Fs.stat(filePath);
    if (!stat?.isFile) return c.text(notFound(), 404);

    // Extract extension.
    const dotIndex = reqPath.lastIndexOf('.');
    const ext = dotIndex === -1 ? '' : reqPath.slice(dotIndex + 1).toLowerCase();
    const mime = mimeByExt[ext];

    // Only allow the configured serve types.
    if (!mime || !allowedMimes.has(mime)) return c.text(notFound(), 404);

    // Load and serve manually.
    const file = await Fs.read(filePath);
    if (!file.data) {
      const code = 500;
      const msg = Str.builder()
        .line(`${code} - Failed to load file: ${file.errorReason}`)
        .line(`Serving from ${dir}`)
        .toString();
      return c.text(msg, code);
    }

    const body = new Uint8Array(file.data);
    return c.newResponse(body, {
      status: 200,
      headers: {
        'content-type': mime,
        'content-length': String(body.byteLength),
      },
    });
  });

  // Static middleware with restricted MIME table.
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
