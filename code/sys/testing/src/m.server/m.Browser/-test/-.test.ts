import { describe, expect, it, Testing, Time } from '../../-test.ts';
import { Browser } from '../mod.ts';

const workerV1 = `
  self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()));
  self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
`;

const workerTombstone = `
  self.addEventListener('install', (event) => event.waitUntil(self.skipWaiting()));
  self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
      await caches.delete('fixture:owned');
      await self.registration.unregister();
    })());
  });
`;

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
});

describe('Browser.ServiceWorker.scenario', () => {
  it('claiming worker → tombstone update → verified unregister and owned cleanup', async () => {
    let workerRequests = 0;
    let registerPageRequests = 0;
    let serverProofRequests = 0;
    const server = Testing.Http.server((request) => {
      const { pathname } = new URL(request.url);
      if (pathname === '/sw.js') {
        workerRequests += 1;
        return new Response(workerRequests === 1 ? workerV1 : workerTombstone, {
          headers: {
            'cache-control': 'no-store',
            'content-type': 'text/javascript; charset=utf-8',
            'service-worker-allowed': '/',
          },
        });
      }
      if (pathname === '/register') {
        registerPageRequests += 1;
        return html(registerPageRequests === 1 ? registerPage() : '<title>inert reload</title>');
      }
      if (pathname === '/server-proof') {
        serverProofRequests += 1;
        return new Response('provenance-backed-server', {
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        });
      }
      return html('<title>@sys/testing clean page</title>');
    });

    try {
      const origin = new URL(server.url.raw).origin;
      const scope = `${origin}/`;
      const scriptURL = `${origin}/sw.js`;
      const result = await Browser.ServiceWorker.scenario({
        steps: [
          { kind: 'navigate', url: `${origin}/clean` },
          { kind: 'observe', expect: { kind: 'controller', state: 'absent' } },
          { kind: 'observe', expect: { kind: 'registrations', count: 0 } },
          { kind: 'navigate', url: `${origin}/register` },
          {
            kind: 'observe',
            expect: { kind: 'controller', state: 'present', scriptURL },
          },
          {
            kind: 'observe',
            expect: {
              kind: 'worker',
              scope,
              slot: 'active',
              state: 'activated',
              scriptURL,
            },
          },
          { kind: 'observe', expect: { kind: 'cache', name: 'fixture:owned', state: 'present' } },
          {
            kind: 'observe',
            expect: { kind: 'cache', name: 'fixture:unrelated', state: 'present' },
          },
          { kind: 'update', scope },
          { kind: 'reload' },
          { kind: 'observe', expect: { kind: 'controller', state: 'absent' } },
          { kind: 'observe', expect: { kind: 'registration', scope, state: 'absent' } },
          { kind: 'observe', expect: { kind: 'cache', name: 'fixture:owned', state: 'absent' } },
          {
            kind: 'observe',
            expect: { kind: 'cache', name: 'fixture:unrelated', state: 'present' },
          },
          { kind: 'navigate', url: `${origin}/server-proof` },
          { kind: 'observe', expect: { kind: 'controller', state: 'absent' } },
        ],
        settle: 50,
        timeout: 10_000,
      });

      expect(result.ok).to.eql(true);
      expect(result.steps.length).to.eql(16);
      expect(workerRequests >= 2).to.eql(true);
      expect(registerPageRequests).to.eql(2);
      expect(serverProofRequests).to.eql(1);
      expect(result.steps[8].outcome).to.eql({
        kind: 'update',
        scope,
        matches: 1,
        requested: true,
      });
      result.steps.forEach((step) => {
        if (step.outcome.kind === 'observed') expect(step.outcome.matched).to.eql(true);
      });
      expect(result.attestation).to.eql('controlled-run-only');
      expect(result.steps[14].observation.href).to.eql(`${origin}/server-proof`);
      expect(Object.isFrozen(result)).to.eql(true);
      expect(Object.isFrozen(result.steps)).to.eql(true);
      expect(Object.isFrozen(result.steps[0].observation.available)).to.eql(true);
    } finally {
      await server.dispose();
    }
  });

  it('fresh profiles → do not inherit a prior run registration or controller', async () => {
    const server = Testing.Http.server((request) => {
      const { pathname } = new URL(request.url);
      if (pathname === '/sw.js') {
        return new Response(workerV1, {
          headers: {
            'content-type': 'text/javascript; charset=utf-8',
            'service-worker-allowed': '/',
          },
        });
      }
      return html(pathname === '/register' ? registerPage() : '<title>clean</title>');
    });

    try {
      const origin = new URL(server.url.raw).origin;
      const first = await Browser.ServiceWorker.scenario({
        steps: [
          { kind: 'navigate', url: `${origin}/register` },
          {
            kind: 'observe',
            expect: { kind: 'controller', state: 'present', scriptURL: `${origin}/sw.js` },
          },
        ],
      });
      const second = await Browser.ServiceWorker.scenario({
        steps: [
          { kind: 'navigate', url: `${origin}/clean` },
          { kind: 'observe', expect: { kind: 'controller', state: 'absent' } },
          { kind: 'observe', expect: { kind: 'registrations', count: 0 } },
        ],
      });

      expect(first.ok).to.eql(true);
      expect(second.ok).to.eql(true);
      expect(second.steps.length).to.eql(3);
    } finally {
      await server.dispose();
    }
  });

  it('exact update scope → preserves legal dollar replacement sequences', async () => {
    const workerScope = '/a$&b/';
    const server = Testing.Http.server((request) => {
      const { pathname } = new URL(request.url);
      if (pathname === '/sw-dollar.js') {
        return new Response(workerV1, {
          headers: {
            'cache-control': 'no-store',
            'content-type': 'text/javascript; charset=utf-8',
            'service-worker-allowed': '/',
          },
        });
      }
      return html(`<script type="module">
        await navigator.serviceWorker.register('/sw-dollar.js', { scope: '${workerScope}' });
      </script>`);
    });
    try {
      const origin = new URL(server.url.raw).origin;
      const scope = `${origin}${workerScope}`;
      const result = await Browser.ServiceWorker.scenario({
        steps: [
          { kind: 'navigate', url: server.url.raw },
          { kind: 'observe', expect: { kind: 'registration', scope, state: 'present' } },
          { kind: 'update', scope },
        ],
      });

      expect(result.ok).to.eql(true);
      expect(result.steps[2].outcome).to.eql({
        kind: 'update',
        scope,
        matches: 1,
        requested: true,
      });
    } finally {
      await server.dispose();
    }
  });

  it('zero-match update → records exact observation and cannot report success', async () => {
    const server = startPageServer();
    try {
      const origin = new URL(server.url.raw).origin;
      const result = await Browser.ServiceWorker.scenario({
        steps: [
          { kind: 'navigate', url: server.url.raw },
          { kind: 'update', scope: `${origin}/` },
        ],
      });

      expect(result.ok).to.eql(false);
      expect(result.steps[1].outcome).to.eql({
        kind: 'update',
        scope: `${origin}/`,
        matches: 0,
        requested: false,
      });
    } finally {
      await server.dispose();
    }
  });

  it('diagnostic truncation → omitted error still prevents success', async () => {
    const server = Testing.Http.server(() => {
      return html(
        `<script>console.warn('retained-warning'); console.error('omitted-error');</script>`,
      );
    });
    try {
      const result = await Browser.ServiceWorker.scenario({
        steps: [{ kind: 'navigate', url: server.url.raw }],
        maxDiagnostics: 1,
      });

      expect(result.ok).to.eql(false);
      expect(result.diagnostics.truncated).to.eql(true);
      expect(result.diagnostics.omitted >= 1).to.eql(true);
      expect(result.diagnostics.omittedErrors >= 1).to.eql(true);
      expect(result.diagnostics.entries[0].level).to.eql('warning');
    } finally {
      await server.dispose();
    }
  });

  it('unavailable lifecycle APIs → cannot confirm absence or aggregate success', async () => {
    const server = Testing.Http.server(() => {
      return html(`<script>
        delete Navigator.prototype.serviceWorker;
        delete globalThis.caches;
      </script>`);
    });
    try {
      const result = await Browser.ServiceWorker.scenario({
        steps: [
          { kind: 'navigate', url: server.url.raw },
          { kind: 'observe', expect: { kind: 'controller', state: 'absent' }, timeout: 50 },
        ],
      });

      expect(result.ok).to.eql(false);
      expect(result.steps[0].observation.available).to.eql({
        serviceWorker: false,
        cacheStorage: false,
      });
      expect(result.steps[1].outcome).to.include({ kind: 'observed', matched: false });
    } finally {
      await server.dispose();
    }
  });

  it('aggregate evidence bound → rejects oversized retained scenario results', async () => {
    const cacheNames = Array.from(
      { length: 200 },
      (_, index) => `fixture:${String(index).padStart(3, '0')}:${'x'.repeat(90)}`,
    );
    const server = Testing.Http.server(() => {
      return html(`<script type="module">
        await Promise.all(${JSON.stringify(cacheNames)}.map((name) => caches.open(name)));
      </script>`);
    });
    try {
      let caught: unknown;
      try {
        await Browser.ServiceWorker.scenario({
          steps: [
            { kind: 'navigate', url: server.url.raw },
            ...Array.from({ length: 99 }, () => ({
              kind: 'observe' as const,
              expect: { kind: 'cache' as const, name: cacheNames[0], state: 'present' as const },
            })),
          ],
          settle: 100,
        });
      } catch (cause) {
        caught = cause;
      }

      expect(caught).to.be.instanceOf(Error);
      expect((caught as Error).message).to.contain('result exceeded 512000 bytes');
    } finally {
      await server.dispose();
    }
  });

  it('unmatched observation → settles as bounded result evidence', async () => {
    const server = startPageServer();
    try {
      const started = Time.now.timestamp;
      const result = await Browser.ServiceWorker.scenario({
        steps: [
          { kind: 'navigate', url: server.url.raw },
          {
            kind: 'observe',
            expect: { kind: 'registration', scope: '/', state: 'present' },
            timeout: 50,
            interval: 10,
          },
        ],
      });

      expect(result.ok).to.eql(false);
      expect(result.steps[1].outcome.kind).to.eql('observed');
      expect(result.steps[1].outcome).to.include({ matched: false });
      expect(Time.now.timestamp - started < 5_000).to.eql(true);
    } finally {
      await server.dispose();
    }
  });

  it('redirect escape → blocks before the second origin receives a request', async () => {
    let escapedRequests = 0;
    const escaped = Testing.Http.server(() => {
      escapedRequests += 1;
      return html('<title>escaped</title>');
    });
    const admitted = Testing.Http.server(() => {
      return Response.redirect(escaped.url.raw, 302);
    });

    try {
      let caught: unknown;
      try {
        await Browser.ServiceWorker.scenario({
          steps: [{ kind: 'navigate', url: admitted.url.raw }],
          timeout: 2_000,
        });
      } catch (cause) {
        caught = cause;
      }
      expect(caught).to.be.instanceOf(Error);
      expect((caught as Error).message).to.contain('ERR_BLOCKED_BY_CLIENT');
      expect(escapedRequests).to.eql(0);
    } finally {
      await admitted.dispose();
      await escaped.dispose();
    }
  });

  it('cross-origin navigation input → rejects before escaping fixed origin', async () => {
    const server = startPageServer();
    try {
      let caught: unknown;
      try {
        await Browser.ServiceWorker.scenario({
          steps: [
            { kind: 'navigate', url: server.url.raw },
            { kind: 'navigate', url: 'https://example.com/' },
          ],
        });
      } catch (cause) {
        caught = cause;
      }
      expect(caught).to.be.instanceOf(TypeError);
      expect((caught as Error).message).to.contain('fixed origin');
    } finally {
      await server.dispose();
    }
  });

  it('hard input bounds → reject before browser launch', async () => {
    const steps = Array.from({ length: 101 }, () => ({ kind: 'reload' as const }));
    steps[0] = { kind: 'reload' };
    let caught: unknown;
    try {
      await Browser.ServiceWorker.scenario({
        steps: [{ kind: 'navigate', url: 'http://127.0.0.1/' }, ...steps],
      });
    } catch (cause) {
      caught = cause;
    }
    expect(caught).to.be.instanceOf(TypeError);
    expect((caught as Error).message).to.contain('steps must not exceed');
  });
});

function startPageServer() {
  return Testing.Http.server(() => {
    return html('<title>@sys/testing Browser.load</title><main>ok</main>');
  });
}

function registerPage() {
  return `
    <title>@sys/testing Service Worker scenario</title>
    <script type="module">
      await caches.open('fixture:owned');
      await caches.open('fixture:unrelated');
      await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    </script>`;
}

function html(body: string) {
  return new Response(`<!doctype html>${body}`, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
