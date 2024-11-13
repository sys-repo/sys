export const main = `
import { VitePress } from '@sys/driver-vitepress';
import { c, Args, HttpServer, Pkg } from '@sys/std-s';
import { pkg } from '../src/pkg.ts';

type C = 'dev' | 'build' | 'serve';
type T = { cmd: C };
const argv = Args.parse<T>(Deno.args);
const cmd = argv.cmd ?? 'dev';

const inDir = './.tmp/docs.main-sample';
const outDir = './dist';

if (cmd === 'dev') {
  /**
   * Start HMR dev server.
   */
  const server = await VitePress.dev({ inDir, pkg });
  await server.listen();
} else if (cmd === 'build') {
  /**
   * Transpile production bundle (Pkg).
   */
  const res = await VitePress.build({ inDir, outDir, pkg });
  console.info(res.toString({ pad: true }));
} else if (cmd === 'serve') {
  /**
   * Run local HTTP server on bundle.
   */
  const dist = (await Pkg.Dist.load('./dist')).dist;
  const hash = dist?.hash.digest ?? '';
  const app = HttpServer.create({ pkg, hash, static: ['/*', outDir] });
  const config = HttpServer.options(8080, pkg, hash);
  Deno.serve(config, app.fetch);
} else {
 console.error('cmd action not supported:', cmd);
}
`.slice(1);
