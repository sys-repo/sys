import { type t, HttpServer, Pkg, pkg } from './common.ts';

/**
 * Run a local HTTP server from entry command-args.
 */
export async function start(args: t.HttpEntryArgsStart) {
  if (args.cmd !== 'start') return;
  const { port = 8080, dir = 'dist' } = args;

  const dist = (await Pkg.Dist.load(dir)).dist;
  const hash = dist?.hash.digest ?? '';
  const pkg = wrangle.pkg(dist);

  const app = HttpServer.create({ pkg, hash, static: ['/*', dir] });
  const options = HttpServer.options({ port, pkg, hash });

  Deno.serve(options, app.fetch);
  await HttpServer.keyboard({ port, print: true });
}

/**
 * Helpers
 */
const wrangle = {
  pkg(dist?: t.DistPkg) {
    return dist?.pkg || pkg;
  },
} as const;
