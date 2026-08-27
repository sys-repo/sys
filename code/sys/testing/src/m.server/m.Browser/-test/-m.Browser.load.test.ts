import { describe, expect, it, Testing } from '../../-test.ts';
import { Fs, Process } from '../common.ts';
import { Is as UniversalIs } from '@sys/std/is';
import { Browser } from '../mod.ts';

// @ts-expect-error `Native` exists only on the server entrypoint.
type NativeMustBeAbsent = typeof UniversalIs.Native;

describe('Browser.load', () => {
  it('loads a local page in Chrome without browser runtime errors', async () => {
    const server = startPageServer();
    try {
      const res = await Browser.load(server.url.raw);
      if (!res.ok) console.info(res);
      expect(res.ok).to.eql(true);
      expect(res.errors).to.eql([]);
      expect(res.browser).to.eql('Chrome');
    } finally {
      await server.dispose();
    }
  });

  it('bundles universal std Is → executes in real Chrome without server surface', async () => {
    const bundle = await bundleUniversalIsFixture();
    let proofRequests = 0;
    const server = Testing.Http.server((request) => {
      const { pathname } = new URL(request.url);
      if (pathname === '/bundle.js') {
        return new Response(bundle, {
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
      const res = await Browser.load(server.url.raw, { waitAfterLoad: 1_000 });
      if (!res.ok) console.info(res);
      expect(res.ok).to.eql(true);
      expect(res.errors).to.eql([]);
      expect(proofRequests).to.eql(1);
    } finally {
      await server.dispose();
    }
  });
});

async function bundleUniversalIsFixture() {
  const output = await Process.capture({
    args: [
      'bundle',
      '--platform=browser',
      '--frozen',
      '--no-remote',
      './src/m.server/m.Browser/-test/u.fixture.std-is.browser.ts',
    ],
    cmd: Deno.execPath(),
    cwd: Fs.Path.fromFileUrl(new URL('../../../../', import.meta.url)),
    timeoutMs: 30_000,
    maxStdoutBytes: 1_000_000,
    maxStderrBytes: 100_000,
  });

  const failed = output.outcome !== 'exited' || !output.success;
  if (failed || output.stdoutTruncated || output.stderrTruncated) {
    const detail = output.text.stderr.trim() || `outcome=${output.outcome}`;
    throw new Error(`Failed to bundle universal std Is fixture: ${detail}`);
  }
  return new Uint8Array(output.stdout);
}

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
