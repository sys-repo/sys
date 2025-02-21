import { type t, c, Fs, HttpServer, pkg, Pkg } from './common.ts';

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

  const app = HttpServer.create({ pkg, hash, static: ['/*', dir] });
  const options = HttpServer.options({ port, pkg, hash, silent });

  const fmtDir = c.gray(dir.replace(/^\.\//, ''));
  const fmtDirExists = c.yellow(!dirExists ? c.bold('(does not exist)') : '');
  console.info(c.gray(`Folder:   ${fmtDir} ${fmtDirExists}`));

  Deno.serve(options, app.fetch);
  await HttpServer.keyboard({ port, print: !silent });
}

/**
 * Helpers
 */
const wrangle = {
  pkg(dist?: t.DistPkg) {
    return dist?.pkg || pkg;
  },
} as const;
