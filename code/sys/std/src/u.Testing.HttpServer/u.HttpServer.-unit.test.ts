import { describe, expect, it } from '../-test.ts';
import { Testing } from './mod.ts';

describe('Testing.HttpServer', () => {
  const Http = Testing.HttpServer;

  it('create: listen → dispose (close)', async () => {
    const server = Http.server();
    expect(server.disposed).to.eql(false);

    expect(server.addr.port).to.be.a('number');
    expect(server.addr.port).to.not.eql(0);
    expect(server.url.base).to.eql(`http://0.0.0.0:${server.addr.port}/`);

    await server.dispose();
    expect(server.disposed).to.eql(true);
  });

  it('fetch: default handler', async () => {
    const server = Http.server(() => new Response('Hello 👋'));
    const url = server.url.join('foo');
    const res = await fetch(url);
    expect(res.url).to.eql(url);
    expect(res.status).to.eql(200);
    expect(await res.text()).to.eql('Hello 👋');
    await server.dispose();
  });

  it('response: JSON', async () => {
    const server1 = Http.server(() => Http.json({ foo: 123 }));
    const server2 = Http.server((req) => Http.json(req, { foo: 456 }));
    const url1 = server1.url.join('foo');
    const url2 = server2.url.join('bar');
    const res1 = await fetch(url1);
    const res2 = await fetch(url2);

    expect(await res1.json()).to.eql({ foo: 123 });
    expect(await res2.json()).to.eql({ foo: 456 });

    expect(res1.headers.get('x-request-url')).to.eql(null);
    expect(res2.headers.get('x-request-url')).to.eql(url2);

    await server1.dispose();
    await server2.dispose();
  });
});
