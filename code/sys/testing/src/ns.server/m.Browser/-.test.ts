import { describe, expect, it, Testing } from '../-test.ts';
import { Browser } from './mod.ts';

describe('Browser.load', () => {
  it('loads a local page in Chrome without browser runtime errors', async () => {
    const server = startServer();
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

function startServer() {
  return Testing.Http.server(() => {
    return new Response(
      '<!doctype html><title>@sys/testing Browser.load</title><main>ok</main>',
      { headers: { 'content-type': 'text/html; charset=utf-8' } },
    );
  });
}
