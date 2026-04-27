import { Env, Fs, HttpServer, type t } from '../common.ts';
import { pkg } from '../../pkg.ts';
import { StripeFixture, methodNotAllowed } from './mod.StripeFixture.ts';

export async function serve(args: t.StripeFixture.ServeArgs = {}) {
  const cwd = args.cwd ?? Fs.cwd();
  const env = await Env.load({ cwd });
  const hostname = args.hostname ?? '127.0.0.1';
  const port = args.port ?? readPort(env.get('STRIPE_FIXTURE_PORT'), 9090);
  const app = createApp({ cwd });
  const options = HttpServer.options({ port, pkg });
  const listener = Deno.serve({ ...options, hostname }, app.fetch);
  await listener.finished;
}

function createApp(args: { readonly cwd: string }) {
  const app = HttpServer.create({ pkg, static: false });
  app.post(StripeFixture.path, async () => await StripeFixture.createSession({ cwd: args.cwd }));
  app.all(StripeFixture.path, () => methodNotAllowed('POST'));
  app.get('/favicon.ico', () => new Response(null, { status: 204 }));
  app.get('/', () =>
    Response.json({
      name: pkg.name,
      fixture: 'stripe-runtime',
      endpoint: StripeFixture.path,
    })
  );
  return app;
}

function readPort(input: string, fallback: number) {
  const port = Number(input || fallback);
  if (!Number.isInteger(port) || port <= 0 || port > 65_535) {
    throw new Error(`Invalid STRIPE_FIXTURE_PORT: ${JSON.stringify(input)}`);
  }
  return port as t.PortNumber;
}
