import { Browser, describe, expect, Fs, it, Path, Testing } from '../../../-test.ts';

const WAIT_AFTER_LOAD = 750;

describe('Stripe.PaymentElement dist browser runtime', () => {
  it('loads local dist without browser runtime exceptions', async () => {
    if (Deno.env.get('SYS_DRIVER_STRIPE_BROWSER_DIST') !== '1') return;

    const dist = Path.resolve('./dist');
    if (!(await Fs.exists(dist))) throw new Error('Missing ./dist. Run `deno task build` before this test.');

    const server = startStaticServer(dist);
    try {
      const res = await Browser.load(server.url.raw, {
        waitAfterLoad: WAIT_AFTER_LOAD,
        allowError: isAllowedBrowserError,
      });
      if (!res.ok) console.info(res);
      expect(res.errors).to.eql([]);
    } finally {
      await server.dispose();
    }
  });
});

/**
 * Static server:
 */
function startStaticServer(root: string) {
  return Testing.Http.server(async (req) => {
    const url = new URL(req.url);
    if (url.pathname === '/-/stripe/payment-intent') {
      return Response.json({ error: 'No local Stripe runtime is configured for this browser test.' }, { status: 503 });
    }

    if (url.pathname === '/favicon.ico') return new Response(null, { status: 204 });

    const pathname = decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname);
    const path = Path.resolve(root, `.${pathname}`);
    if (!path.startsWith(root)) return new Response('Forbidden', { status: 403 });

    try {
      const file = await Fs.read(path);
      if (!file.ok || !file.data) return new Response('Not found', { status: 404 });
      return new Response(file.data.slice(), { headers: { 'content-type': contentType(path) } });
    } catch {
      return new Response('Not found', { status: 404 });
    }
  });
}

function contentType(path: string) {
  if (path.endsWith('.html')) return 'text/html; charset=utf-8';
  if (path.endsWith('.js')) return 'text/javascript; charset=utf-8';
  if (path.endsWith('.json')) return 'application/json; charset=utf-8';
  if (path.endsWith('.css')) return 'text/css; charset=utf-8';
  if (path.endsWith('.svg')) return 'image/svg+xml';
  return 'application/octet-stream';
}

function isAllowedBrowserError(input: string) {
  const text = input.trim();
  const isMissingRuntimeSession = text.includes('/-/stripe/payment-intent') &&
    (text.includes('status of 503') || text.includes('ERR_CONNECTION_REFUSED'));
  return isMissingRuntimeSession;
}

