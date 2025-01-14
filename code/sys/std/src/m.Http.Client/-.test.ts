import { Testing, describe, expect, it } from '../m.Testing.Server/mod.ts';
import { Http } from '../mod.ts';
import { DEFAULTS } from './common.ts';
import { HttpClient } from './mod.ts';

describe('Http.client', () => {
  const JsonMimetype = DEFAULTS.contentType;
  const TestHttp = Testing.HttpServer;

  it('API', () => {
    expect(Http.Client).to.equal(HttpClient);
    expect(Http.client).to.eql(HttpClient.create);
  });

  describe('headers', () => {
    it('headers: (default)', () => {
      const client = Http.client();
      expect(client.headers).to.eql({ 'Content-Type': JsonMimetype });
      expect(client.header('Content-Type')).to.eql(JsonMimetype);
    });

    it('header: authToken → headers:{ Authorization } ← Bearer Token', () => {
      const client1 = Http.client({ accessToken: 'my-jwt' });
      const client2 = Http.client({ accessToken: () => 'my-dynamic' });
      expect(client1.header('Authorization')).to.eql(`Bearer my-jwt`);
      expect(client2.header('Authorization')).to.eql('my-dynamic');
    });

    it('header: static/dynamic content-type', () => {
      const client1 = Http.client({ contentType: 'foo' });
      const client2 = Http.client({ contentType: () => 'bar' });
      expect(client1.contentType).to.eql('foo');
      expect(client2.contentType).to.eql('bar');
    });

    it('header: does not exist', () => {
      const client = Http.client();
      expect(client.header('x-foo')).to.eql(undefined);
    });

    it('headers: manipulate', () => {
      let count = 0;
      const client = Http.client({
        headers(e) {
          count++;
          expect(e.get('Content-Type')).to.eql(JsonMimetype);

          e.set('x-foo', 123).set('x-bar', 'hello');
          expect(e.get('x-foo')).to.eql('123');
          expect(e.get('x-bar')).to.eql('hello');

          e.set('x-foo', null).set('x-bar', '  '); // NB: removed.
          expect(e.get('x-foo')).to.eql(undefined);
          expect(e.get('x-bar')).to.eql(undefined);

          const keys = Object.keys(e.headers);
          expect(keys.includes('x-foo')).to.eql(false);
          expect(keys.includes('x-bar')).to.eql(false);
        },
      });

      client.headers;
      expect(count).to.eql(1);
    });

    it('headers passed to server', async () => {
      const server = TestHttp.server((req) => {
        const headers = Http.toHeaders(req.headers);
        return TestHttp.json({ headers });
      });
      const client = Http.client({ headers: (e) => e.set('x-foo', '123') });

      const url = server.url.base;
      const res1 = await client.get(url);
      const res2 = await client.get(url, { headers: { 'x-bar': '456' } });

      const json1 = await res1.json();
      const json2 = await res2.json();

      expect(json1.headers['x-foo']).to.eql('123');
      expect(json2.headers['x-foo']).to.eql('123');
      expect(json2.headers['x-bar']).to.eql('456');

      await server.dispose();
    });
  });

  describe('fetch (HTTP methods/verbs)', () => {
    it('fetch', async () => {
      const server = TestHttp.server(() => new Response('foo'));
      const client = Http.client();

      const url = server.url.join('foo');
      const res = await client.fetch(url);

      expect(res.url).to.eql(url);
      expect(res.status).to.eql(200);
      expect(await res.text()).to.eql('foo');

      await server.dispose();
    });

    it('GET', async () => {
      let _method = '';
      const server = TestHttp.server((req) => {
        _method = req.method;
        return TestHttp.json({ foo: 123 });
      });
      const client = Http.client();
      const url = server.url.join('foo');
      const res = await client.get(url);

      expect(_method).to.eql('GET');
      expect(res.url).to.eql(url);
      expect(res.status).to.eql(200);
      expect(await res.json()).to.eql({ foo: 123 });

      await server.dispose();
    });

    it('HEAD', async () => {
      let _method = '';
      const server = TestHttp.server((req) => {
        _method = req.method;
        return new Response();
      });
      const client = Http.client();
      const url = server.url.join('foo');
      const res = await client.head(url);

      expect(_method).to.eql('HEAD');
      expect(res.url).to.eql(url);
      expect(res.status).to.eql(200);
      await server.dispose();
    });

    it('OPTIONS', async () => {
      let _method = '';
      const server = TestHttp.server((req) => {
        _method = req.method;
        return new Response();
      });
      const client = Http.client();
      const url = server.url.join('foo');
      const res = await client.options(url);

      expect(_method).to.eql('OPTIONS');
      expect(res.url).to.eql(url);
      expect(res.status).to.eql(200);
      await res.text();
      await server.dispose();
    });

    it('PUT', async () => {
      let _method = '';
      const server = TestHttp.server(async (req) => {
        _method = req.method;
        return TestHttp.json({ data: await req.json() });
      });
      const client = Http.client();
      const url = server.url.join('foo');
      const res = await client.put(url, { msg: 'hello' });

      expect(_method).to.eql('PUT');
      expect(res.url).to.eql(url);
      expect(res.status).to.eql(200);
      expect(await res.json()).to.eql({ data: { msg: 'hello' } });
      await server.dispose();
    });

    it('POST', async () => {
      let _method = '';
      const server = TestHttp.server(async (req) => {
        _method = req.method;
        return TestHttp.json({ data: await req.json() });
      });
      const client = Http.client();
      const url = server.url.join('foo');
      const res = await client.post(url, { msg: 'hello' });

      expect(_method).to.eql('POST');
      expect(res.url).to.eql(url);
      expect(res.status).to.eql(200);
      expect(await res.json()).to.eql({ data: { msg: 'hello' } });
      await server.dispose();
    });

    it('PATCH', async () => {
      let _method = '';
      const server = TestHttp.server(async (req) => {
        _method = req.method;
        return TestHttp.json({ data: await req.json() });
      });
      const client = Http.client();
      const url = server.url.join('foo');
      const res = await client.patch(url, { msg: 'hello' });

      expect(_method).to.eql('PATCH');
      expect(res.url).to.eql(url);
      expect(res.status).to.eql(200);
      expect(await res.json()).to.eql({ data: { msg: 'hello' } });
      await server.dispose();
    });

    it('DELETE', async () => {
      let _method = '';
      const server = TestHttp.server((req) => {
        _method = req.method;
        return TestHttp.json({ foo: 123 });
      });
      const client = Http.client();
      const url = server.url.join('foo');
      const res = await client.delete(url);

      expect(_method).to.eql('DELETE');
      expect(res.url).to.eql(url);
      expect(res.status).to.eql(200);
      expect(await res.json()).to.eql({ foo: 123 });
      await server.dispose();
    });
  });
});
