/**
 * @module
 * Run on import:
 *
 *    Performs an file/folder scaffolding initialization
 *    of a standard VitePress project.
 *
 * https://vite.dev
 */
import { type t, Args, Fs, HttpServer, pkg, Pkg, DEFAULTS } from './common.ts';
import { VitePress } from '../m.VitePress/mod.ts';
import { upgrade } from './-main.fn.upgrade.ts';

export async function main(argv: string[]) {
  const args = Args.parse<t.CmdArgs>(argv);
  const cmd = args.cmd ?? DEFAULTS.cmd;

  if (args.cmd === 'dev') {
    /**
     * Start HMR development server.
     */
    const { inDir = DEFAULTS.inDir } = args;
    const server = await VitePress.dev({ inDir, pkg });
    await server.listen();
    return;
  }

  if (args.cmd === 'build') {
    /**
     * Transpile the production bundle (Pkg).
     */
    const { inDir = DEFAULTS.inDir } = args;
    const res = await VitePress.build({ inDir, pkg });
    console.info(res.toString({ pad: true }));
    return;
  }

  if (args.cmd === 'serve') {
    /**
     * Run local HTTP server on bundle.
     */
    const { inDir = DEFAULTS.inDir } = args;
    const dir = Fs.join(inDir, '.vitepress/dist');
    const dist = (await Pkg.Dist.load(dir)).dist;
    const hash = dist?.hash.digest ?? '';

    const port = 8080;
    const app = HttpServer.create({ pkg, hash, static: ['/*', dir] });
    Deno.serve(HttpServer.options(port, pkg, hash), app.fetch);
    await HttpServer.keyboard({ port });

    return;
  }

  if (args.cmd === 'upgrade') {
    await upgrade(argv);
    return;
  }

  // Command not matched.
  console.error(`The given --cmd="${cmd}" value not supported`);
}

/**
 * Export
 */
export default main;
