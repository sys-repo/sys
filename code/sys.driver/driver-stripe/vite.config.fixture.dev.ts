import { Fs } from '@sys/fs';
import { type t } from '@sys/driver-vite';
import { StripeFixture } from './src/server/mod.ts';

type VitePlugin = NonNullable<t.ViteConfigAppOptions['vitePlugins']>[number];

/**
 * Dev-only Stripe runtime endpoint.
 *
 * This is a local fixture for `deno task dev`, not production runtime code.
 * Secrets stay on the Vite server process. The browser receives only the
 * publishable key and a fresh PaymentIntent client_secret at request time.
 */
export function stripeDevRuntime(): VitePlugin {
  return {
    name: 'sys.driver-stripe.dev-runtime',
    apply: 'serve',
    configureServer(server) {
      const cwd = Fs.cwd();

      server.middlewares.use(StripeFixture.path, async (req, res) => {
        const request = new Request(`http://localhost${StripeFixture.path}`, { method: req.method });
        const response = await StripeFixture.handle(request, { cwd });
        await sendNodeResponse(res, response ?? Response.json({ error: 'Not found.' }, { status: 404 }));
      });
    },
  };
}

async function sendNodeResponse(
  res: { statusCode: number; setHeader: (key: string, value: string) => void; end: (body?: string) => void },
  response: Response,
) {
  res.statusCode = response.status;
  response.headers.forEach((value, key) => res.setHeader(key, value));
  res.end(await response.text());
}
