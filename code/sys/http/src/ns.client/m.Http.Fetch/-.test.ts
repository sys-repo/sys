import { Http } from '../mod.ts';
import { Testing, describe, expect, it } from '../../-test.ts';
import { rx } from './common.ts';
import { Fetch } from './mod.ts';

describe('Http.Fetch', () => {
  it('API', () => {
    expect(Http.Fetch).to.equal(Fetch);
  });

  describe('Fetch.disposable', () => {
    it('200: success', async () => {
      const life = rx.disposable();
      const server = Testing.Http.server(() => Testing.Http.json({ foo: 123 }));
      const url = server.url.base;
      const fetch = Fetch.disposable(life.dispose$);
      expect(fetch.disposed).to.eql(false);

      const res = await fetch.json(url);
      expect(res.ok).to.eql(true);
      expect(res.status).to.eql(200);
      expect(res.url).to.eql(url);
      expect(res.data).to.eql({ foo: 123 });
      expect(res.error).to.eql(undefined);

      expect(fetch.disposed).to.eql(false);
      await server.dispose();
    });

    it('404: error with headers', async () => {
      const life = rx.disposable();
      const server = Testing.Http.server(() => Testing.Http.error(404, 'Not Found'));
      const fetch = Fetch.disposable(life.dispose$);

      const url = server.url.base;
      const headers = { foo: 'bar' };
      const res = await fetch.json(url, { headers });
      expect(res.ok).to.eql(false);
      expect(res.status).to.eql(404);
      expect(res.url).to.eql(url);
      expect(res.data).to.eql(undefined);

      expect(res.error?.name).to.eql('HttpError');
      expect(res.error?.message).to.include('HTTP/GET request failed');
      expect(res.error?.cause?.message).to.include('404 Not Found');
      expect(res.error?.headers).to.eql({ foo: 'bar' });

      await server.dispose();
    });

    it('disposed', async () => {
      const life = rx.disposable();
      const server = Testing.Http.server(() => Testing.Http.json({ foo: 123 }));
      const url = server.url.base;
      const fetch = Fetch.disposable(life.dispose$);
      expect(fetch.disposed).to.eql(false);

      const promise = fetch.json(url);
      life.dispose();
      const res = await promise;

      expect(res.ok).to.eql(false);
      expect(res.status).to.eql(499);
      expect(res.url).to.eql(url);
      expect(res.data).to.eql(undefined);
      expect(res.error?.name).to.eql('HttpError');
      expect(res.error?.cause?.message).to.include(
        'Fetch operation disposed before completing (499)',
      );

      expect(fetch.disposed).to.eql(true);
      await server.dispose();
    });
  });
});
