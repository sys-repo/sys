import { Browser, describe, expect, it, Path, Testing } from '../../../-test.ts';

const WAIT_AFTER_LOAD = 750;

describe('Stripe.PaymentElement dist browser runtime', () => {
  it('loads local dist without browser runtime exceptions', async () => {
    if (Deno.env.get('SYS_DRIVER_STRIPE_BROWSER_DIST') !== '1') return;

    const dist = Path.resolve('./dist');
    if (!(await exists(dist))) throw new Error('Missing ./dist. Run `deno task build` before this test.');

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
      const file = await Deno.readFile(path);
      return new Response(file, { headers: { 'content-type': contentType(path) } });
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) return new Response('Not found', { status: 404 });
      throw error;
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

function isAllowedBrowserError(text: string) {
  return /^Failed to load resource: the server responded with a status of 503/.test(text);
}

async function exists(path: string) {
  try {
    await Deno.stat(path);
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}
