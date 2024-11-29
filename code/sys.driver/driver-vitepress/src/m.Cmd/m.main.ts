import { VitePress } from '../m.VitePress/mod.ts';

import { type t, Args, DEFAULTS, Fs, HttpServer, pkg, Pkg } from './common.ts';
import { upgrade } from './u.upgrade.ts';

type F = t.VitePressCmdLib['main'];

/**
 * Main command entry point.
 *
 * Pass: "--cmd=<sub-command>"
 *       to specify which action to take, and then the paratmers
 *       that pertain to <sub-command> as defined in the <VitePressCmd> type.
 */
export const main: F = async (argv) => {
  const args = Args.parse<t.CmdArgsMain>(argv);
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
     * Run local HTTP server on production bundle.
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
};
