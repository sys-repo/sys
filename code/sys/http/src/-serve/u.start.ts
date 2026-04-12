import { type t, Fs, HttpServer, Pkg, pkg } from './common.ts';

/**
 * Run a local HTTP server from entry command-args.
 */
export async function start(args: t.HttpServeArgs) {
  const { port = 8080 } = args;
  const dir = Fs.resolve(args.dir ?? '.');

  const dist = (await Pkg.Dist.load(dir)).dist;
  const hash = dist?.hash.digest ?? '';
  const pkg = wrangle.pkg(dist);

  const app = HttpServer.create({ pkg, hash, static: ['/*', dir] });
  const options = HttpServer.options({ port, pkg, hash, dir });

  Deno.serve(options, app.fetch);
  if (resolveKeyboard(args)) await HttpServer.keyboard({ port, print: true });
}

/** Resolve whether the interactive keyboard listener should start. */
export function resolveKeyboard(args: t.HttpServeArgs): boolean {
  return args.keyboard ?? args['non-interactive'] !== true;
}

/**
 * Helpers:
 */
const wrangle = {
  pkg(dist?: t.DistPkg) {
    return dist?.pkg || pkg;
  },
} as const;
