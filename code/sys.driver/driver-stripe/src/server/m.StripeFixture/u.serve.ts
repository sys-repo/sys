import { Env, Fs, HttpServer, Path, Pkg, Str, type t } from '../common.ts';
import { pkg } from '../../pkg.ts';
import { StripeFixture, methodNotAllowed } from './mod.StripeFixture.ts';

export async function serve(args: t.StripeFixture.ServeArgs = {}) {
  const cwd = args.cwd ?? Fs.cwd();
  const dist = Path.resolve(cwd, args.dist ?? './dist');

  if (!(await Fs.exists(dist))) {
    throw new Error(Str.dedent(`
      Missing ${Path.relative(cwd, dist) || './dist'}.

      Run:
        deno task build

      Then start the local built-artifact fixture:
        deno task serve:fixture
    `));
  }

  const env = await Env.load({ cwd });
  const hostname = args.hostname ?? '127.0.0.1';
  const port = args.port ?? readPort(env.get('PORT'));
  const distPkg = (await Pkg.Dist.load(dist)).dist;
  const serverPkg = distPkg?.pkg || pkg;
  const hash = distPkg?.hash.digest ?? '';

  const app = HttpServer.create({ pkg: serverPkg, hash, static: false });
  app.post(StripeFixture.path, async () => await StripeFixture.createSession({ cwd }));
  app.all(StripeFixture.path, () => methodNotAllowed('POST'));
  app.get('/favicon.ico', () => new Response(null, { status: 204 }));
  app.use('*', HttpServer.static(dist));

  const options = HttpServer.options({ port, pkg: serverPkg, hash, dir: dist });
  const listener = Deno.serve({ ...options, hostname }, app.fetch);
  await listener.finished;
}

function readPort(input: string) {
  const port = Number(input || 8080);
  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    throw new Error(`Invalid PORT: ${JSON.stringify(input)}`);
  }
  return port;
}
