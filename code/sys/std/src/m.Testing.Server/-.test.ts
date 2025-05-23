import { describe, expect, it } from '../-test.ts';
import { Testing } from './mod.ts';

describe('Testing.HttpServer', () => {
  it('create: listen → dispose (close)', async () => {
    const server = Testing.Http.server();
    expect(server.disposed).to.eql(false);

    expect(server.addr.port).to.be.a('number');
    expect(server.addr.port).to.not.eql(0);
    expect(server.url.base).to.eql(`http://0.0.0.0:${server.addr.port}/`);

    await server.dispose();
    expect(server.disposed).to.eql(true);
  });

  it('fetch: default handler', async () => {
    const server = Testing.Http.server(() => new Response('Hello 👋'));
    const url = server.url.join('foo');
    const res = await fetch(url);
    expect(res.url).to.eql(url);
    expect(res.status).to.eql(200);
    expect(await res.text()).to.eql('Hello 👋');
    await server.dispose();
  });

  it('Http.json →response: application/json', async () => {
    const server1 = Testing.Http.server(() => Testing.Http.json({ foo: 123 }));
    const server2 = Testing.Http.server((req) => Testing.Http.json(req, { foo: 456 }));
    const url1 = server1.url.join('foo');
    const url2 = server2.url.join('bar');
    const res1 = await fetch(url1);
    const res2 = await fetch(url2);

    expect(res1.headers.get('content-type')).to.eql('application/json');
    expect(res1.headers.get('x-request-url')).to.eql(null);
    expect(res2.headers.get('x-request-url')).to.eql(url2);

    expect(await res1.json()).to.eql({ foo: 123 });
    expect(await res2.json()).to.eql({ foo: 456 });

    await server1.dispose();
    await server2.dispose();
  });

  it('Http.text →response: text/plain', async () => {
    const server = Testing.Http.server(() => Testing.Http.text('foobar'));
    const url = server.url.join('foo');
    const res = await fetch(url);
    expect(res.headers.get('content-type')).to.eql('text/plain');
    expect(await res.text()).to.eql('foobar');
    await server.dispose();
  });

  it('Http.blob → response: application/octet-stream', async () => {
    const dataIn = new Uint8Array([1, 2, 3]);
    const server = Testing.Http.server(() => Testing.Http.blob(dataIn));
    const url = server.url.join('foo');
    const res = await fetch(url);
    expect(res.headers.get('content-type')).to.eql('application/octet-stream');
    const dataOut = new Uint8Array(await res.arrayBuffer());
    expect(dataOut).to.eql(dataIn);
    await server.dispose();
  });

  it('Http.error → response:404', () => {
    const res = Testing.Http.error(404, 'Not Found');
    expect(res.ok).to.eql(false);
    expect(res.status).to.eql(404);
    expect(res.statusText).to.eql('Not Found');
  });
});
