import { describe, expect, it } from '../-test.ts';
import { HttpPull, HttpServer, serveFileBytes, serveFileWithEtag } from './mod.ts';
import { Http } from '../http/mod.ts';

describe('HTTP Server', () => {
  it('API', async () => {
    const m = await import('@sys/http/server');
    expect(m.Http).to.equal(Http);
    expect(m.HttpPull).to.equal(HttpPull);
    expect(m.HttpServer).to.equal(HttpServer);
    expect(m.serveFileBytes).to.equal(serveFileBytes);
    expect(m.serveFileWithEtag).to.equal(serveFileWithEtag);
  });

  describe('lifecycle entry', () => {
    it('exports only the aggregate HttpServer identity', async () => {
      const m = await import('@sys/http/server');
      const lifecycle = await import('@sys/http/server/lifecycle');
      expect(Object.keys(lifecycle)).to.eql(['HttpServer']);
      expect(lifecycle.HttpServer).to.equal(m.HttpServer);
      expect(Object.isFrozen(lifecycle.HttpServer)).to.eql(true);
    });
  });
});
