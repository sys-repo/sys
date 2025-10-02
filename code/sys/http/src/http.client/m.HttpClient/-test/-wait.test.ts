import { describe, expect, it } from '../../../-test.ts';
import { Http } from '../mod.ts';

describe('Http: wait/readiness helpers', () => {
  describe('Http.waitFor', () => {
    it('resolves when endpoint returns 200 (default HEAD probe)', async () => {
      const handler: Deno.ServeHandler = (req) => {
        const { pathname } = new URL(req.url);
        if (pathname === '/ok') return new Response(null, { status: 200 });
        return new Response('not found', { status: 404 });
      };

      const listener = Deno.serve({ port: 0 }, handler);
      const url = `${baseUrlFrom(listener)}/ok`;

      const res = await Http.waitFor(url, { timeout: 5_000, interval: 50 });
      expect(res.url).to.equal(url);
      expect(res.attempts).to.be.greaterThan(0);
      expect(res.elapsed).to.be.greaterThan(0);

      await listener.shutdown();
    });

    it('treats 404 as ready by default', async () => {
      const handler: Deno.ServeHandler = () => new Response('missing', { status: 404 });
      const listener = Deno.serve({ port: 0 }, handler);
      const url = `${baseUrlFrom(listener)}/missing`;

      const res = await Http.waitFor(url, { timeout: 5_000, interval: 50 });
      expect(res.lastStatus).to.equal(404);

      await listener.shutdown();
    });

    it('falls back from HEAD→GET when HEAD is rejected (405)', async () => {
      const handler: Deno.ServeHandler = (req) => {
        const { pathname } = new URL(req.url);
        if (pathname === '/head-405') {
          if (req.method === 'HEAD') return new Response(null, { status: 405 });
          if (req.method === 'GET') return new Response('ok', { status: 200 });
        }
        return new Response('nope', { status: 404 });
      };
      const listener = Deno.serve({ port: 0 }, handler);
      const url = `${baseUrlFrom(listener)}/head-405`;

      const res = await Http.waitFor(url, { timeout: 5_000, interval: 50, method: 'HEAD' });
      expect(res.lastStatus).to.equal(200);

      await listener.shutdown();
    });

    it('custom predicate (sync): header signals readiness', async () => {
      let hits = 0;
      const handler: Deno.ServeHandler = () => {
        hits += 1;
        const ready = hits >= 3; // third probe becomes ready
        return new Response(ready ? 'READY' : 'NOT YET', {
          status: 200,
          headers: ready ? { 'x-ready': 'true' } : { 'x-ready': 'false' },
        });
      };
      const listener = Deno.serve({ port: 0 }, handler);
      const url = `${baseUrlFrom(listener)}/custom`;

      const res = await Http.waitFor(url, {
        timeout: 5_000,
        interval: 20,
        method: 'GET',
        predicate: (r) => r.headers.get('x-ready') === 'true',
      });

      expect(hits).to.be.greaterThanOrEqual(3);
      expect(res.attempts).to.be.greaterThanOrEqual(3);

      await listener.shutdown();
    });

    it('times out when server never starts listening', async () => {
      // Start then immediately shut down to ensure the port is closed.
      const listener = Deno.serve({ port: 0 }, () => new Response('ok'));
      const url = `${baseUrlFrom(listener)}/never`;
      await listener.shutdown();

      let err: unknown;
      try {
        await Http.waitFor(url, { timeout: 400, interval: 50, requestTimeout: 100 });
      } catch (e) {
        err = e;
      }
      expect(err).to.be.instanceOf(Error);
      expect(String(err)).to.include('Timed out waiting for');
    });
  });

  describe('Http.alive', () => {
    it('returns true when reachable within timeout', async () => {
      const listener = Deno.serve({ port: 0 }, () => new Response('ok', { status: 200 }));
      const url = `${baseUrlFrom(listener)}/ok`;

      const ok = await Http.alive(url, { timeout: 1_000, interval: 50 });
      expect(ok).to.equal(true);

      await listener.shutdown();
    });

    it('returns false when unreachable within timeout', async () => {
      const listener = Deno.serve({ port: 0 }, () => new Response('ok'));
      const url = `${baseUrlFrom(listener)}/ok`;
      await listener.shutdown();

      const ok = await Http.alive(url, { timeout: 300, interval: 50, requestTimeout: 100 });
      expect(ok).to.equal(false);
    });
  });
});

/**
 * Helpers:
 */
const baseUrlFrom = (listener: Deno.HttpServer<Deno.NetAddr>) => {
  const { port } = listener.addr as Deno.NetAddr;
  return `http://127.0.0.1:${port}`;
};
