import { Http } from '../m.Http/mod.ts';
import { Testing, describe, expect, it } from '../m.Testing.HttpServer/mod.ts';
import { rx } from './common.ts';
import { Fetch } from './mod.ts';

describe('Http.Fetch', () => {
  const TestHttp = Testing.HttpServer;

  it('API', () => {
    expect(Http.Fetch).to.equal(Fetch);
  });

  describe('Fetch.disposable', () => {
    it('success: 200', async () => {
      const life = rx.disposable();
      const server = TestHttp.server(() => TestHttp.json({ foo: 123 }));
      const url = server.url.base;
      const fetch = Fetch.disposable(life.dispose$);
      expect(fetch.disposed).to.eql(false);

      const res = await fetch.json(url);
      expect(res.status).to.eql(200);
      expect(res.url).to.eql(url);
      expect(res.data).to.eql({ foo: 123 });
      expect(res.error).to.eql(undefined);

      expect(fetch.disposed).to.eql(false);
      await server.dispose();
    });
  });
});
