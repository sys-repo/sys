import { describe, expect, it } from '../-test.ts';
import { Browser } from './mod.ts';

describe('Browser.load', () => {
  it('loads a local page in Chrome without browser runtime errors', async () => {
    const server = await startServer();
    try {
      const res = await Browser.load(server.url);
      if (!res.ok) console.info(res);
      expect(res.ok).to.eql(true);
      expect(res.errors).to.eql([]);
      expect(res.browser).to.eql('Chrome');
    } finally {
      server.close();
    }
  });
});

async function startServer() {
  const ac = new AbortController();
  const server = Deno.serve(
    { hostname: '127.0.0.1', port: 0, signal: ac.signal, onListen() {} },
    () => {
      return new Response(
        '<!doctype html><title>@sys/testing Browser.load</title><main>ok</main>',
        { headers: { 'content-type': 'text/html; charset=utf-8' } },
      );
    },
  );

  const { addr } = server;
  if (addr.transport !== 'tcp') throw new Error('Expected TCP server address.');

  return {
    url: `http://127.0.0.1:${addr.port}/`,
    close() {
      ac.abort();
      void server.finished.catch(() => undefined);
    },
  };
}
