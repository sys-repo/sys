import { describe, expect, it, Testing } from '../../-test.ts';
import type { Is as UniversalIs } from '@sys/std/is';
import { Browser } from '../mod.ts';
import { browserProofExecutable, consumePreparedBrowserBundle } from './u.browser.proof.ts';

// @ts-expect-error `Native` exists only on the server entrypoint.
type NativeMustBeAbsent = typeof UniversalIs.Native;

const executablePath = await browserProofExecutable();
const universalIsBundle = await consumePreparedBrowserBundle();

describe('Browser.load', () => {
  it('loads a local page in Chrome without browser runtime errors', async () => {
    const server = startPageServer();
    try {
      const res = await Browser.load(server.url.raw, { executablePath });
      if (!res.ok) console.info(res);
      expect(res.ok).to.eql(true);
      expect(res.errors).to.eql([]);
      expect(res.browser).to.eql('Chrome');
    } finally {
      await server.dispose();
    }
  });

  it('bundles universal std Is → executes in real Chrome without server surface', async () => {
    let proofRequests = 0;
    const server = Testing.Http.server((request) => {
      const { pathname } = new URL(request.url);
      if (pathname === '/bundle.js') {
        return new Response(new Uint8Array(universalIsBundle), {
          headers: {
            'cache-control': 'no-store',
            'content-type': 'text/javascript; charset=utf-8',
          },
        });
      }
      if (pathname === '/proof/std-is-universal' && request.method === 'POST') {
        proofRequests += 1;
        return new Response(null, { status: 204 });
      }
      return html('<script type="module" src="/bundle.js"></script>');
    });

    try {
      const res = await Browser.load(server.url.raw, { executablePath, waitAfterLoad: 1_000 });
      if (!res.ok) console.info(res);
      expect(res.ok).to.eql(true);
      expect(res.errors).to.eql([]);
      expect(proofRequests).to.eql(1);
    } finally {
      await server.dispose();
    }
  });
});

function startPageServer() {
  return Testing.Http.server(() => {
    return html('<title>@sys/testing Browser.load</title><main>ok</main>');
  });
}

function html(body: string) {
  return new Response(`<!doctype html>${body}`, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
