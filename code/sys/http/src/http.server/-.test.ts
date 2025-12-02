import { describe, expect, it } from '../-test.ts';
import { HttpPull, HttpServer, serveFileWithEtag } from './mod.ts';
import { Http } from '../http/mod.ts';

describe('HTTP Server', () => {
  it('API', async () => {
    const m = await import('@sys/http/server');
    expect(m.Http).to.equal(Http);
    expect(m.HttpPull).to.equal(HttpPull);
    expect(m.HttpServer).to.equal(HttpServer);
    expect(m.serveFileWithEtag).to.equal(serveFileWithEtag);
  });
});
