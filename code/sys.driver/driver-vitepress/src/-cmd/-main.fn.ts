/**
 * @module
 * Run on import:
 *
 *    Performs an file/folder scaffolding initialization
 *    of a standard VitePress project.
 *
 * https://vite.dev
 */
import { type t, Fs, Args, HttpServer, pkg, Pkg, c } from '../common.ts';
import { ViteLog } from '../m.VitePress/common.ts';
import { VitePress } from '../m.VitePress/mod.ts';

type A = ADev | ABuild | AServe | AUpgrade;
type P = t.StringPath;
type ADev = { cmd: 'dev'; inDir?: P; srcDir?: P; open?: boolean };
type ABuild = { cmd: 'build'; inDir?: P };
type AServe = { cmd: 'serve'; inDir?: P };
type AUpgrade = { cmd: 'upgrade'; inDir?: P };

const DEF = {
  cmd: 'dev',
  inDir: './',
  open: undefined,
} as const;

export async function main(argv: string[]) {
  const args = Args.parse<A>(argv);
  const cmd = args.cmd ?? DEF.cmd;

  if (args.cmd === 'dev') {
    /**
     * Start HMR development server.
     */
    const { inDir = DEF.inDir } = args;
    const server = await VitePress.dev({ inDir, pkg });
    await server.listen();
    return;
  }

  if (args.cmd === 'build') {
    /**
     * Transpile the production bundle (Pkg).
     */
    const { inDir = DEF.inDir } = args;
    const res = await VitePress.build({ inDir, pkg });
    console.info(res.toString({ pad: true }));
    return;
  }

  if (args.cmd === 'serve') {
    /**
     * Run local HTTP server on bundle.
     */
    const { inDir = DEF.inDir } = args;
    const dir = Fs.join(inDir, '.vitepress/dist');
    const dist = (await Pkg.Dist.load(dir)).dist;
    const hash = dist?.hash.digest ?? '';

    const app = HttpServer.create({ pkg, hash, static: ['/*', dir] });
    const config = HttpServer.options(8080, pkg, hash);
    Deno.serve(config, app.fetch);
    return;
  }

  if (args.cmd === 'upgrade') {
    /**
     * Migration:
     * Upgrade the state of the local project configuration.
     */
    const { inDir = DEF.inDir } = args;
    await VitePress.Env.init({ inDir, force: true });
    console.info();
    ViteLog.Module.log(pkg);
    console.info(c.gray(`Migrated project to version: ${c.green(pkg.version)}`));
    console.info();
    return;
  }

  // Command not matched.
  console.error(`The given --cmd="${cmd}" value not supported`);
}

/**
 * Export
 */
export default main;
