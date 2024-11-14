/**
 * @module
 * Run on import:
 *
 *    Performs an file/folder scaffolding initialization
 *    of a standard VitePress project.
 *
 * https://vite.dev
 */
import { Args, HttpServer, pkg, Pkg, c } from '../common.ts';
import { ViteLog } from '../m.VitePress/common.ts';
import { VitePress } from '../m.VitePress/mod.ts';

export type TArgs = {
  cmd: 'dev' | 'build' | 'serve' | 'upgrade';
  inDir?: string;
  outDir?: string;
  srcDir?: string;
};

export async function main(argv: string[]) {
  const args = Args.parse<TArgs>(argv);
  const cmd = args.cmd ?? 'dev';
  const inDir = args.inDir ?? './';
  const outDir = args.outDir ?? './dist';
  const srcDir = args.srcDir;

  if (cmd === 'dev') {
    /**
     * Start HMR development server.
     */
    const server = await VitePress.dev({ inDir, pkg });
    await server.listen();
    return;
  }

  if (cmd === 'build') {
    /**
     * Transpile the production bundle (Pkg).
     */
    const res = await VitePress.build({ inDir, outDir, pkg });
    console.info(res.toString({ pad: true }));
    return;
  }

  if (cmd === 'serve') {
    /**
     * Run local HTTP server on bundle.
     */
    const dist = (await Pkg.Dist.load('./dist')).dist;
    const hash = dist?.hash.digest ?? '';
    const app = HttpServer.create({ pkg, hash, static: ['/*', outDir] });
    const config = HttpServer.options(8080, pkg, hash);
    Deno.serve(config, app.fetch);
    return;
  }

  if (cmd === 'upgrade') {
    /**
     * (Migration)
     * Upgrade the state of the local project configuration.
     */
    await VitePress.Env.init({ inDir, srcDir, force: true });
    console.info();
    ViteLog.Module.log(pkg);
    console.info(c.gray(`Migrated project to version: ${c.green(pkg.version)}`));
    console.info();
    return;
  }

  // Command not matched.
  console.error(`The given --cmd="${cmd}" value not supported`);
}

export default main;
