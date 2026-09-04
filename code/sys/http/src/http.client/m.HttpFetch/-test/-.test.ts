import { describe, expect, it, Testing, Time, Url } from '../../../-test.ts';
import { Http } from '../../mod.ts';

import { Rx, Schedule, type t } from '../common.ts';
import { Fetch } from '../mod.ts';
import { fetchOptions } from './u.fixture.ts';

const ORIGIN = 'https://example.test';
const optionsFor = (
  origin: t.StringUrl,
  options: Omit<t.HttpFetch.CreateOptions, 'policy'> = {},
) => fetchOptions([origin], { credentialOrigins: [origin] }, options);

describe('Http.Fetch', () => {
  it('API', () => {
    expect(Http.Fetch).to.equal(Fetch);
    expect(Http.fetcher).to.equal(Fetch.make);
    expect(Http.Url).to.equal(Url);
  });

  describe('create', () => {
    it('default', () => {
      const fetch = Http.fetcher(fetchOptions([ORIGIN]));
      expect(fetch.disposed).to.eql(false);
      expect(fetch.headers).to.eql({});
      fetch.dispose();
    });

    it('param: { headers } ← pre-fetch mutation function', () => {
      let count = 0;
      const fetch = Http.fetcher(fetchOptions([ORIGIN], {}, {
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
      }));

      fetch.headers;
      fetch.headers;
      expect(count).to.eql(2);

      expect(fetch.headers).to.eql({ 'x-foo': '123', 'x-bar': 'hello' });
      expect(fetch.header('x-foo')).to.eql('123');
      fetch.dispose();
    });

    it('param: { accessToken }', () => {
      const fetch1 = Http.fetcher(fetchOptions([ORIGIN], {}, { accessToken: '0x123' }));
      const fetch2 = Http.fetcher(
        fetchOptions([ORIGIN], {}, { accessToken: '  Bearer   0x123  ' }),
      );
      const fetch3 = Http.fetcher(
        fetchOptions([ORIGIN], {}, { accessToken: () => 'Bearer 0x456' }),
      );
      expect(fetch1.header('Authorization')).to.eql('Bearer 0x123');
      expect(fetch2.header('Authorization')).to.eql('Bearer 0x123');
      expect(fetch3.header('Authorization')).to.eql('Bearer 0x456');
      fetch1.dispose();
      fetch2.dispose();
      fetch3.dispose();
    });
  });

  describe('fetch: success', () => {
    it('200: json', async () => {
      const server = Testing.Http.server((req) => {
        expect(req.headers.get('content-type')).to.eql(null);
        return Testing.Http.json({ foo: 123 });
      });
      const url = server.url.toString();
      const fetch = Fetch.make(optionsFor(server.url.toURL().origin));
      expect(fetch.disposed).to.eql(false);

      const res = await fetch.json(url);
      expect(res.ok).to.eql(true);
      if (!res.ok) throw new Error('Expected a successful Fetch response');
      expect(res.status).to.eql(200);
      expect(res.requestedUrl).to.eql(url);
      expect(res.finalUrl).to.eql(url);
      expect(res.data).to.eql({ foo: 123 });
      expect(res.error).to.eql(undefined);
      expect(res.headers.get('content-type')).to.eql('application/json');

      expect(fetch.disposed).to.eql(false);
      fetch.dispose();
      await server.dispose();
    });

    it('200: text', async () => {
      const text = 'foo-👋';
      const server = Testing.Http.server((req) => {
        expect(req.headers.get('content-type')).to.eql(null);
        return Testing.Http.text(text);
      });
      const url = server.url.toString();
      const fetch = Fetch.make(optionsFor(server.url.toURL().origin));
      const res = await fetch.text(url);

      expect(res.ok).to.eql(true);
      if (!res.ok) throw new Error('Expected a successful Fetch response');
      expect(res.status).to.eql(200);
      expect(res.requestedUrl).to.eql(url);
      expect(res.finalUrl).to.eql(url);
      expect(res.data).to.eql(text);
      expect(res.error).to.eql(undefined);
      expect(res.headers.get('content-type')).to.eql('text/plain');

      fetch.dispose();
      await server.dispose();
    });

    it('200: blob (binary)', async () => {
      const dataIn = new Uint8Array([1, 2, 3]);
      const server = Testing.Http.server((req) => {
        expect(req.headers.get('content-type')).to.eql(null);
        return Testing.Http.blob(dataIn);
      });
      const url = server.url.toString();
      const fetch = Fetch.make(optionsFor(server.url.toURL().origin));

      const res = await fetch.blob(url);
      const dataOut = new Uint8Array(res.data ? await res.data?.arrayBuffer() : []);

      expect(res.ok).to.eql(true);
      if (!res.ok) throw new Error('Expected a successful Fetch response');
      expect(res.status).to.eql(200);
      expect(res.requestedUrl).to.eql(url);
      expect(res.finalUrl).to.eql(url);
      expect(dataOut).to.eql(dataIn);
      expect(res.error).to.eql(undefined);
      expect(res.headers.get('content-type')).to.eql('application/octet-stream');
      fetch.dispose();
      await server.dispose();
    });

    it('200: head', async () => {
      const server = Testing.Http.server((req) => {
        expect(req.method).to.eql('HEAD');
        expect(req.headers.get('content-type')).to.eql(null);

        return new Response(new Uint8Array(1234), {
          status: 200, // The HTTP layer strips the body for HEAD.
          headers: {
            'content-type': 'text/plain',
            'x-foo': 'hello',
          },
        });
      });

      const url = server.url.toString();
      const fetch = Fetch.make(optionsFor(server.url.toURL().origin));
      const res = await fetch.head(url);

      expect(res.ok).to.eql(true);
      if (!res.ok) throw new Error('Expected a successful Fetch response');
      expect(res.status).to.eql(200);
      expect(res.requestedUrl).to.eql(url);
      expect(res.finalUrl).to.eql(url);
      expect(res.data).to.eql(undefined); // ← no payload.
      expect(res.error).to.eql(undefined);

      // Response headers are still present.
      expect(res.headers.get('content-type')).to.eql('text/plain');
      expect(res.headers.get('x-foo')).to.eql('hello');

      fetch.dispose();
      await server.dispose();
    });
  });

  describe('fetch: fail', () => {
    it('404: error with headers', async () => {
      const life = Rx.lifecycle();
      const server = Testing.Http.server(() => Testing.Http.error(404, 'Not Found'));
      const fetch = Fetch.make(optionsFor(server.url.toURL().origin, { until: life.dispose$ }));

      const url = server.url.toString();
      const headers = { foo: 'bar' };
      const res = await fetch.json(url, { headers });
      expect(res.ok).to.eql(false);
      if (res.ok) throw new Error('Expected a failed Fetch response');
      expect(res.status).to.eql(404);
      expect(res.url).to.eql(url);
      expect(res.data).to.eql(undefined);

      expect(res.error?.name).to.eql('HttpError');
      expect(res.error?.message).to.include('HTTP/GET request failed');
      expect(res.error?.cause?.message).to.include('404 Not Found');
      expect(res.error?.headers.foo).to.eql(undefined);
      expect(res.error?.headers['content-type']).to.eql(undefined);
      expect(res.headers.get('content-type')).to.eql(null);

      fetch.dispose();
      await server.dispose();
    });

    it('520: client error (JSON parse failure)', async () => {
      const server = Testing.Http.server(() => Testing.Http.text('hello'));
      const fetch = Fetch.make(optionsFor(server.url.toURL().origin));

      const url = server.url.toString();
      const res = await fetch.json(url);

      expect(res.status).to.eql(520);
      expect(res.error?.name).to.eql('HttpError');
      expect(res.error?.message).to.include('HTTP/GET request failed');
      expect(res.error?.cause?.message).to.include('Failed while decoding response');
      expect(res.error?.cause?.cause).to.eql(undefined);

      fetch.dispose();
      await server.dispose();
    });
  });

  describe('headers', () => {
    it('passes custom headers to an explicit credential origin', async () => {
      let count = 0;
      const server = Testing.Http.server((req) => {
        count++;
        expect(req.headers.get('x-foo')).to.eql('123');
        expect(req.headers.get('x-bar')).to.eql('456');
        return Testing.Http.text('hello');
      });
      const fetch = Fetch.make(optionsFor(server.url.toURL().origin, {
        headers: (event) => event.set('x-foo', 123).set('x-bar', 456),
      }));

      await fetch.text(server.url.toString());
      expect(count).to.eql(1);

      fetch.dispose();
      await server.dispose();
    });

    it('{ accessToken }', async () => {
      const tokens: string[] = [];
      const server = Testing.Http.server((req) => {
        tokens.push(req.headers.get('Authorization') || '');
        return Testing.Http.text('👋');
      });
      const origin = server.url.toURL().origin;
      const fetch1 = Http.fetcher(optionsFor(origin, { accessToken: '  my-jwt  ' }));
      const fetch2 = Http.fetcher(optionsFor(origin, {
        accessToken: () => 'Bearer my-dynamic',
      }));

      const url = server.url.toString();
      await fetch1.text(url);
      await fetch2.text(url);

      expect(tokens).to.eql(['Bearer my-jwt', 'Bearer my-dynamic']);
      fetch1.dispose();
      fetch2.dispose();
      await server.dispose();
    });

    it('merges custom headers with library defaults', async () => {
      const server = Testing.Http.server((req) => {
        expect(req.headers.get('range')).to.eql('bytes=0-0');
        expect(req.headers.get('content-type')).to.eql(null);
        return Testing.Http.blob(new Uint8Array([0]));
      });
      const fetch = Fetch.make(optionsFor(server.url.toURL().origin));

      await fetch.blob(server.url.toString(), { headers: { Range: 'bytes=0-0' } });

      fetch.dispose();
      await server.dispose();
    });

    it('does not overwrite caller-supplied content-type', async () => {
      const server = Testing.Http.server((req) => {
        expect(req.headers.get('content-type')).to.eql('application/x-demo');
        return Testing.Http.text('✔︎');
      });
      const fetch = Fetch.make(optionsFor(server.url.toURL().origin));

      await fetch.text(server.url.toString(), {
        headers: { 'content-type': 'application/x-demo' },
      });

      fetch.dispose();
      await server.dispose();
    });

    it('{ contentTypePolicy: always } sets content-type for GET requests', async () => {
      const server = Testing.Http.server((req) => {
        expect(req.method).to.eql('GET');
        expect(req.headers.get('content-type')).to.eql('application/octet-stream');
        return Testing.Http.blob(new Uint8Array([1]));
      });
      const fetch = Fetch.make(optionsFor(server.url.toURL().origin, {
        contentTypePolicy: 'always',
      }));

      await fetch.blob(server.url.toString());

      fetch.dispose();
      await server.dispose();
    });
  });

  describe('Fetch.byteSize', () => {
    type R = t.HttpFetch.ByteSize.Result;

    it('HEAD: returns size via Content-Length', async () => {
      const server = Testing.Http.server((req) => {
        expect(req.method).to.eql('HEAD');
        return new Response(new Uint8Array(1234), {
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
        return new Response(new Uint8Array(9999), {
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
  });

  describe('lifecycle', () => {
    it('create: { until } input variants', async () => {
      const life = Rx.lifecycle();
      const lifecycle = Rx.lifecycle();
      const abort = new AbortController();
      const { dispose$ } = life;
      const make = (until: t.UntilInput) => Fetch.make(fetchOptions([ORIGIN], {}, { until }));
      const a = make(life.dispose$);
      const b = make([life.dispose$]);
      const c = make([life.dispose$, undefined]);
      const d = make(dispose$);
      const e = make(lifecycle);
      const f = make(abort.signal);
      const all = [a, b, c, d, e, f];

      all.forEach(({ disposed }) => expect(disposed).to.eql(false));
      life.dispose();
      lifecycle.dispose();
      abort.abort('test:abort');
      await Schedule.micro();
      all.forEach(({ disposed }) => expect(disposed).to.eql(true));
    });

    it('dispose$ ← (observable param)', async () => {
      const life = Rx.lifecycle();
      const server = Testing.Http.server(() => Testing.Http.json({ foo: 123 }));
      const url = server.url.toString();
      const fetch = Fetch.make(optionsFor(server.url.toURL().origin, { until: life.dispose$ }));
      expect(fetch.disposed).to.eql(false);

      const promise = fetch.json(url);
      life.dispose();
      const res = await promise;

      expect(res.ok).to.eql(false);
      if (res.ok) throw new Error('Expected a cancelled Fetch response');
      expect(res.status).to.eql(499);
      expect(res.url).to.eql(url);
      expect(res.data).to.eql(undefined);

      const error = res.error;
      expect(error?.name).to.eql('HttpError');
      expect(error?.cause?.message).to.include('Fetch operation cancelled before completing');

      expect(fetch.disposed).to.eql(true);
      await server.dispose();
    });

    it('init.signal aborts request', async () => {
      const server = Testing.Http.server(
        () =>
          new Promise((resolve) => Time.delay(250, () => resolve(Testing.Http.json({ foo: 123 })))),
      );

      const fetch = Fetch.make(optionsFor(server.url.toURL().origin));
      const ctrl = new AbortController();
      const promise = fetch.json(server.url.toString(), { signal: ctrl.signal });
      ctrl.abort();
      const res = await promise;

      expect(res.ok).to.eql(false);
      expect(res.status).to.eql(499);
      expect(fetch.disposed).to.eql(false);
      expect(res.error?.name).to.eql('HttpError');
      fetch.dispose();
      await server.dispose();
    });

    it('lifecycle aborts even when init.signal is provided', async () => {
      const life = Rx.lifecycle();
      const server = Testing.Http.server(
        () =>
          new Promise((resolve) => {
            setTimeout(() => resolve(Testing.Http.json({ foo: 123 })), 250);
          }),
      );

      const fetch = Fetch.make(optionsFor(server.url.toURL().origin, { until: life.dispose$ }));
      const ctrl = new AbortController();
      const promise = fetch.json(server.url.toString(), { signal: ctrl.signal });
      life.dispose();
      const res = await promise;

      expect(res.ok).to.eql(false);
      expect(res.status).to.eql(499);
      expect(fetch.disposed).to.eql(true);
      expect(res.error?.name).to.eql('HttpError');
      await server.dispose();
    });

    it('pre-aborted lifecycle signal prevents network work', async () => {
      let hits = 0;
      const server = Testing.Http.server(() => {
        hits++;
        return Testing.Http.json({ foo: 123 });
      });
      const ctrl = new AbortController();
      ctrl.abort('pre-aborted-lifecycle');
      const fetch = Fetch.make(
        optionsFor(server.url.toURL().origin, { until: ctrl.signal }),
      );

      const res = await fetch.json(server.url.toString());
      expect(res.ok).to.eql(false);
      expect(res.status).to.eql(499);
      expect(res.error?.name).to.eql('HttpError');
      expect(hits).to.eql(0);
      expect(fetch.disposed).to.eql(true);

      fetch.dispose();
      await server.dispose();
    });

    it('pre-aborted init.signal fails immediately', async () => {
      const server = Testing.Http.server(() => Testing.Http.json({ foo: 123 }));
      const fetch = Fetch.make(optionsFor(server.url.toURL().origin));
      const ctrl = new AbortController();
      ctrl.abort();

      const res = await fetch.json(server.url.toString(), { signal: ctrl.signal });
      expect(res.ok).to.eql(false);
      expect(res.status).to.eql(499);
      expect(res.error?.name).to.eql('HttpError');

      fetch.dispose();
      await server.dispose();
    });

    it('fetch.dispose', () => {
      const life = Rx.lifecycle();
      const fetch = Fetch.make(fetchOptions([ORIGIN], {}, { until: life.dispose$ }));

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
