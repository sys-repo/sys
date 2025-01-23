import { Testing, describe, expect, it } from '../../-test.ts';
import { Http } from '../mod.ts';
import { rx } from './common.ts';
import { Fetch } from './mod.ts';

describe('Http.Fetch', () => {
  it('API', () => {
    expect(Http.Fetch).to.equal(Fetch);
    expect(Http.fetch).to.equal(Fetch.create);
  });

  it('create', () => {
    const life = rx.disposable();
    const fetch = Fetch.create(life.dispose$);
    expect(fetch.disposed).to.eql(false);
  });

  describe('fetch: success', () => {
    it('200: json', async () => {
      const life = rx.disposable();
      const server = Testing.Http.server(() => Testing.Http.json({ foo: 123 }));
      const url = server.url.base;
      const fetch = Fetch.create(life.dispose$);
      expect(fetch.disposed).to.eql(false);

      const res = await fetch.json(url);
      expect(res.ok).to.eql(true);
      expect(res.status).to.eql(200);
      expect(res.url).to.eql(url);
      expect(res.data).to.eql({ foo: 123 });
      expect(res.error).to.eql(undefined);
      expect(res.headers.get('content-type')).to.eql('application/json');

      expect(fetch.disposed).to.eql(false);
      await server.dispose();
    });

    it('200: text', async () => {
      const life = rx.disposable();
      const text = 'foo-👋';
      const server = Testing.Http.server(() => Testing.Http.text(text));
      const url = server.url.base;
      const fetch = Fetch.create(life.dispose$);
      expect(fetch.disposed).to.eql(false);

      const res = await fetch.text(url);

      expect(res.ok).to.eql(true);
      expect(res.status).to.eql(200);
      expect(res.url).to.eql(url);
      expect(res.data).to.eql(text);
      expect(res.error).to.eql(undefined);

      expect(fetch.disposed).to.eql(false);
      await server.dispose();
    });
  });

  describe('fetch: fail', () => {
    it('404: error with headers', async () => {
      const life = rx.disposable();
      const server = Testing.Http.server(() => Testing.Http.error(404, 'Not Found'));
      const fetch = Fetch.create(life.dispose$);

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

    it('520: client error (JSON parse failure)', async () => {
      const server = Testing.Http.server(() => Testing.Http.text('hello'));
      const fetch = Fetch.create();

      const url = server.url.base;
      const res = await fetch.json(url);

      expect(res.status).to.eql(520);
      expect(res.error?.name).to.eql('HttpError');
      expect(res.error?.message).to.include('HTTP/GET request failed');
      expect(res.error?.cause?.message).to.include('Failed while fetching');
      expect(res.error?.cause?.cause?.message).to.include('is not valid JSON');

      await server.dispose();
    });
  });

  describe('dispose', () => {
    it('dispose$ ← (observable param)', async () => {
      const life = rx.disposable();
      const server = Testing.Http.server(() => Testing.Http.json({ foo: 123 }));
      const url = server.url.base;
      const fetch = Fetch.create(life.dispose$);
      expect(fetch.disposed).to.eql(false);

      const promise = fetch.json(url);
      life.dispose();
      const res = await promise;

      expect(res.ok).to.eql(false);
      expect(res.status).to.eql(499);
      expect(res.url).to.eql(url);
      expect(res.data).to.eql(undefined);

      const error = res.error;
      expect(error?.name).to.eql('HttpError');
      expect(error?.cause?.message).to.include('Fetch operation disposed before completing (499');

      expect(fetch.disposed).to.eql(true);
      await server.dispose();
    });

    it('fetch.dispose', async () => {
      const life = rx.disposable();
      const fetch = Fetch.create(life.dispose$);

      const fired = { life: 0, fetch: 0 };
      life.dispose$.subscribe(() => fired.life++);
      fetch.dispose$.subscribe(() => fired.fetch++);

      expect(fetch.disposed).to.eql(false);
      fetch.dispose();
      expect(fetch.disposed).to.eql(true);

      expect(fired.life).to.eql(0);
      expect(fired.fetch).to.eql(1);
    });
  });
});
