/**
 * @module
 * Run on import:
 *
 *    Performs an file/folder scaffolding initialization
 *    of a standard VitePress project.
 *
 * https://vite.dev
 */
import { type t, Fs, Args, HttpServer, pkg, Pkg, c, Jsr } from '../common.ts';
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
    const registryInfo = (await Jsr.Fetch.Pkg.versions('@sys/driver-vitepress')).data;
    const current = pkg.version;
    const latest = registryInfo?.latest;

    console.log('TODO 🐷 ');
    console.log('latest', latest);
    console.log('current', current);
    console.log(`-------------------------------------------`);

    /**
     * TODO 🐷
     * - update {imports} map within deno.json file if diff
     * - and run `$ deno install --reload` to pull the new nodule.
     * - then run the upgrade again ← RECURSION (then exit here)
     */

    // Update template files.
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
