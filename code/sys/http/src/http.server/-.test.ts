import { describe, expect, it } from '../-test.ts';
import { serveFileWithEtag } from './m.HttpServer/mod.ts';
import { HttpPull, HttpServer } from './mod.ts';

describe('HTTP Server', () => {
  it('API', async () => {
    const m = await import('@sys/http/server');
    expect(m.HttpPull).to.equal(HttpPull);
    expect(m.HttpServer).to.equal(HttpServer);
    expect(m.serveFileWithEtag).to.equal(serveFileWithEtag);
  });
});
