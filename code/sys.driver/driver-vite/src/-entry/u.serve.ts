import { type t, c, Fs, Http, pkg, Pkg } from './common.ts';

/**
 * Run a local HTTP server from entry command-args.
 */
export async function serve(args: t.ViteEntryArgsServe) {
  if (args.cmd !== 'serve') return;
  const { port = 8080, dir = 'dist', silent = false } = args;
  const dirExists = await Fs.exists(dir);

  const dist = (await Pkg.Dist.load(dir)).dist;
  const hash = dist?.hash.digest ?? '';
  const pkg = wrangle.pkg(dist);

  const staticDir = `${dir.replace(/^\.\//, '').replace(/\/$/, '')}/`;
  const staticInfo = dirExists ? staticDir : `${staticDir} ${c.yellow(c.bold('(does not exist)'))}`;

  const app = Http.Server.create({ pkg, hash, static: ['/*', dir] });
  const server = Http.Server.start(app, {
    port,
    pkg,
    hash,
    silent,
    info: { static: staticInfo },
    keyboard: { print: !silent },
  });
  await server.finished;
}

/**
 * Helpers
 */
const wrangle = {
  pkg(dist?: t.DistPkg) {
    return dist?.pkg || pkg;
  },
} as const;
