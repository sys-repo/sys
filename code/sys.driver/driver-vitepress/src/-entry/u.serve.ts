import { type t, Fs, HttpServer, PATHS, Pkg, pkg } from './common.ts';

/**
 * Run local HTTP server on production bundle.
 */
export async function serve(args: t.EntryArgsServe) {
  const { inDir = PATHS.inDir } = args;

  if (args.cmd !== 'serve') return;

  const dir = Fs.join(inDir, PATHS.dist);
  const dist = (await Pkg.Dist.load(dir)).dist;
  const hash = dist?.hash.digest ?? '';

  const port = 8080;
  const app = HttpServer.create({ pkg, hash, static: ['/*', dir] });
  Deno.serve(HttpServer.options({ port, pkg, hash }), app.fetch);

  await HttpServer.keyboard({ port, print: true });
}
