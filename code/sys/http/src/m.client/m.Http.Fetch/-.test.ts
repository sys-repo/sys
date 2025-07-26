import { Testing, describe, expect, it } from '../../-test.ts';
import { Http } from '../mod.ts';

import { type t, rx } from './common.ts';
import { Fetch } from './mod.ts';

describe('Http.Fetch', () => {
  it('API', () => {
    expect(Http.Fetch).to.equal(Fetch);
    expect(Http.fetch).to.equal(Fetch.create);

    Http.Url;
  });

  describe('create', () => {
    it('default', () => {
      const fetch = Http.fetch();
      expect(fetch.disposed).to.eql(false);
      expect(fetch.headers).to.eql({});
    });

    it('param: { headers } ← pre-fetch mutation function', () => {
      let count = 0;
      const fetch = Http.fetch({
        headers(e) {
          count++;

          e.set('x-foo', 123).set('x-bar', 'hello');
          expect(e.get('x-foo')).to.eql('123');
          expect(e.get('x-bar')).to.eql('hello');

          e.set('x-foo', null).set('x-bar', '  '); // NB: removed.
          expect(e.get('x-foo')).to.eql(undefined);
          expect(e.get('x-bar')).to.eql(undefined);

          const keys = Object.keys(e.headers);
          expect(keys.includes('x-foo')).to.eql(false);
          expect(keys.includes('x-bar')).to.eql(false);

          e.set('x-foo', 123).set('x-bar', 'hello');
        },
      });

      fetch.headers;
      fetch.headers;
      expect(count).to.eql(2);

      expect(fetch.headers).to.eql({ 'x-foo': '123', 'x-bar': 'hello' });
      expect(fetch.header('x-foo')).to.eql('123');
    });

    it('param: { accessToken }', () => {
      const fetch1 = Http.fetch({ accessToken: '0x123' }); // NB: "Bearer" prefixed automatically
      const fetch2 = Http.fetch({ accessToken: '  Bearer   0x123  ' }); // NB: trims and clean input.
      const fetch3 = Http.fetch({ accessToken: () => 'Bearer 0x456' }); // NB: function does not presume "Bearer"
      expect(fetch1.header('Authorization')).to.eql('Bearer 0x123');
      expect(fetch2.header('Authorization')).to.eql('Bearer 0x123');
      expect(fetch3.header('Authorization')).to.eql('Bearer 0x456');
    });
  });

  describe('fetch: success', () => {
    it('200: json', async () => {
      const server = Testing.Http.server((req) => {
        expect(req.headers.get('content-type')).to.eql('application/json');
        return Testing.Http.json({ foo: 123 });
      });
      const url = server.url.toString();
      const fetch = Fetch.create();
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
      const text = 'foo-👋';
      const server = Testing.Http.server((req) => {
        expect(req.headers.get('content-type')).to.eql('text/plain');
        return Testing.Http.text(text);
      });
      const url = server.url.toString();
      const fetch = Fetch.create();
      const res = await fetch.text(url);

      expect(res.ok).to.eql(true);
      expect(res.status).to.eql(200);
      expect(res.url).to.eql(url);
      expect(res.data).to.eql(text);
      expect(res.error).to.eql(undefined);
      expect(res.headers.get('content-type')).to.eql('text/plain');

      await server.dispose();
    });

    it('200: blob (binary)', async () => {
      const dataIn = new Uint8Array([1, 2, 3]);
      const server = Testing.Http.server((req) => {
        expect(req.headers.get('content-type')).to.eql('application/octet-stream');
        return Testing.Http.blob(dataIn);
      });
      const url = server.url.toString();
      const fetch = Fetch.create();

      const res = await fetch.blob(url);
      const dataOut = new Uint8Array(res.data ? await res.data?.arrayBuffer() : []);

      expect(res.ok).to.eql(true);
      expect(res.status).to.eql(200);
      expect(res.url).to.eql(url);
      expect(dataOut).to.eql(dataIn);
      expect(res.error).to.eql(undefined);
      expect(res.headers.get('content-type')).to.eql('application/octet-stream');
      await server.dispose();
    });

    it('200: head', async () => {
      const server = Testing.Http.server((req) => {
        expect(req.method).to.eql('HEAD');
        expect(req.headers.get('content-type')).to.eql(null);

        return new Response(null, {
          status: 200, // No body for HEAD.
          headers: {
            'content-type': 'text/plain',
            'content-length': '1234',
            'x-foo': 'hello',
          },
        });
      });

      const url = server.url.toString();
      const fetch = Fetch.create();
      const res = await fetch.head(url);

      expect(res.ok).to.eql(true);
      expect(res.status).to.eql(200);
      expect(res.url).to.eql(url);
      expect(res.data).to.eql(undefined); // ← no payload.
      expect(res.error).to.eql(undefined);

      // Response headers are still present.
      expect(res.headers.get('content-type')).to.eql('text/plain');
      expect(res.headers.get('content-length')).to.eql('1234');
      expect(res.headers.get('x-foo')).to.eql('hello');

      await server.dispose();
    });
  });

  describe('fetch: fail', () => {
    it('404: error with headers', async () => {
      const life = rx.disposable();
      const server = Testing.Http.server(() => Testing.Http.error(404, 'Not Found'));
      const fetch = Fetch.create(life.dispose$);

      const url = server.url.toString();
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

      const url = server.url.toString();
      const res = await fetch.json(url);

      expect(res.status).to.eql(520);
      expect(res.error?.name).to.eql('HttpError');
      expect(res.error?.message).to.include('HTTP/GET request failed');
      expect(res.error?.cause?.message).to.include('Failed while fetching');
      expect(res.error?.cause?.cause?.message).to.include('is not valid JSON');

      await server.dispose();
    });
  });

  describe('headers', () => {
    it('passes custom-headers to server', async () => {
      let count = 0;
      const server = Testing.Http.server((req) => {
        count++;
        expect(req.headers.get('x-foo')).to.eql('123');
        expect(req.headers.get('x-bar')).to.eql('456');
        return Testing.Http.text('hello');
      });

      const fetch = Fetch.create({ headers: (e) => e.set('x-foo', 123).set('x-bar', 456) });
      await fetch.text(server.url.toString());
      expect(count).to.eql(1); // NB: server was called.

      await server.dispose();
    });

    it('{ accessToken }', async () => {
      const fetch1 = Http.fetch({ accessToken: '  my-jwt  ' });
      const fetch2 = Http.fetch({ accessToken: () => 'Bearer my-dynamic' });

      let tokens: string[] = [];
      const server = Testing.Http.server((req) => {
        tokens.push(req.headers.get('Authorization') || '');
        return Testing.Http.text('👋');
      });

      const url = server.url.toString();
      await fetch1.text(url);
      await fetch2.text(url);

      expect(tokens).to.eql(['Bearer my-jwt', 'Bearer my-dynamic']);
      await server.dispose();
    });

    it('merges custom headers with library defaults', async () => {
      const server = Testing.Http.server((req) => {
        // ↓ 1-byte probe should keep our Range header.
        expect(req.headers.get('range')).to.eql('bytes=0-0');
        // ↓ blob() still injects its default content-type.
        expect(req.headers.get('content-type')).to.eql('application/octet-stream');
        return Testing.Http.blob(new Uint8Array([0]));
      });

      const fetch = Fetch.create();
      await fetch.blob(server.url.toString(), { headers: { Range: 'bytes=0-0' } });
      await server.dispose();
    });

    it('does not overwrite caller-supplied content-type', async () => {
      const server = Testing.Http.server((req) => {
        // Should be exactly what the caller set.
        expect(req.headers.get('content-type')).to.eql('application/x-demo');
        return Testing.Http.text('✔︎');
      });

      const fetch = Fetch.create();
      await fetch.text(server.url.toString(), {
        headers: { 'content-type': 'application/x-demo' },
      });

      await server.dispose();
    });
  });

  describe('Fetch.byteSize', () => {
    type R = t.ByteSizeResult;

    it('HEAD: returns size via Content-Length', async () => {
      const server = Testing.Http.server((req) => {
        expect(req.method).to.eql('HEAD');
        return new Response(null, {
          status: 200,
          headers: { 'content-length': '1234' },
        });
      });

      const url = server.url.toString();
      const res: R = await Fetch.byteSize(url);

      expect(res).to.eql({ url, bytes: 1234, from: 'head' });
      await server.dispose();
    });

    it('range: 206 with Content-Range header', async () => {
      const server = Testing.Http.server((req) => {
        if (req.method === 'HEAD') {
          return new Response(null, { status: 405 }); // Force fallback.
        }
        expect(req.headers.get('range')).to.eql('bytes=0-0');
        return new Response(new Uint8Array([0]), {
          status: 206,
          headers: { 'content-range': 'bytes 0-0/65536' },
        });
      });

      const url = server.url.toString();
      const res: R = await Fetch.byteSize(url);

      expect(res).to.eql({ url, bytes: 65536, from: 'range' });
      await server.dispose();
    });

    it('range: 200 with Content-Length header', async () => {
      const server = Testing.Http.server((req) => {
        if (req.method === 'HEAD') return new Response(null, { status: 405 });
        return new Response(new Uint8Array([0]), {
          status: 200,
          headers: { 'content-length': '9999' },
        });
      });

      const url = server.url.toString();
      const res: R = await Fetch.byteSize(url);

      expect(res).to.eql({ url, bytes: 9999, from: 'range' });
      await server.dispose();
    });

    it('unknown: size cannot be determined', async () => {
      const server = Testing.Http.server(() => new Response(null, { status: 404 }));

      const url = server.url.toString();
      const res: R = await Fetch.byteSize(url);

      expect(res).to.eql({ url, from: 'unknown' });
      await server.dispose();
    });

    it('overload: uses provided Fetch instance', async () => {
      const server = Testing.Http.server((req) => {
        expect(req.method).to.eql('HEAD');
        expect(req.headers.get('x-custom')).to.eql('demo');
        return new Response(null, {
          status: 200,
          headers: { 'content-length': '321' },
        });
      });

      const url = server.url.toString();
      const fetch = Fetch.create({ headers: (e) => e.set('x-custom', 'demo') });
      // NB: ↓ { 'x-custom': 'demo' }.
      const res: R = await Fetch.byteSize(url, fetch);

      expect(res).to.eql({ url, bytes: 321, from: 'head' });
      await server.dispose();
    });
  });

  describe('lifecycle', () => {
    it('create: dispose$ param variants', () => {
      const life = rx.disposable();
      const { dispose$ } = life;
      const a = Fetch.create(life.dispose$);
      const b = Fetch.create([life.dispose$]);
      const c = Fetch.create([life.dispose$, undefined]);
      const d = Fetch.create({ dispose$ });
      const e = Fetch.create(life);
      const all = [a, b, c, d, e];

      all.forEach(({ disposed }) => expect(disposed).to.eql(false));
      life.dispose();
      all.forEach(({ disposed }) => expect(disposed).to.eql(true));
    });

    it('dispose$ ← (observable param)', async () => {
      const life = rx.disposable();
      const server = Testing.Http.server(() => Testing.Http.json({ foo: 123 }));
      const url = server.url.toString();
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
      expect(error?.cause?.message).to.include('Fetch operation disposed before completing');

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
