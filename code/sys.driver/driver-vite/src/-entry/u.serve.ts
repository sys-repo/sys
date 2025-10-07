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

  const app = Http.Server.create({ pkg, hash, static: ['/*', dir] });
  const options = Http.Server.options({ port, pkg, hash, silent });

  const fmtDir = c.gray(dir.replace(/^\.\//, '').replace(/\/$/, ''));
  const fmtDirExists = c.yellow(!dirExists ? c.bold('(does not exist)') : '');
  console.info(c.gray(`Static:   ${fmtDir}/ ${fmtDirExists}`));

  Deno.serve(options, app.fetch);
  await Http.Server.keyboard({ port, print: !silent });
}

/**
 * Helpers
 */
const wrangle = {
  pkg(dist?: t.DistPkg) {
    return dist?.pkg || pkg;
  },
} as const;
