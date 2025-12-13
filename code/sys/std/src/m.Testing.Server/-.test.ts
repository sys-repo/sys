import { describe, expect, it } from '../-test.ts';
import { Testing } from './mod.ts';

// NOTE:
// CI can expose a test server's listen address as "0.0.0.0" (or "::").
// Those are bind/wildcard addresses and are not always routable as *client* targets.
// Normalize to loopback for any fetch() calls in this test suite.
const toClientUrl = (input: string): string => {
  try {
    const u = new URL(input);

    if (u.hostname === '0.0.0.0') u.hostname = '127.0.0.1';
    if (u.hostname === '::') u.hostname = '::1';

    return u.toString();
  } catch {
    // Fall back to cheap string replacement if input isn't a strict URL.
    return input.replace('://0.0.0.0:', '://127.0.0.1:').replace('://[::]:', '://[::1]:');
  }
};

describe('Testing.HttpServer', () => {
  it('create: listen → dispose (close)', async () => {
    const server = Testing.Http.server();
    expect(server.disposed).to.eql(false);

    expect(server.addr.port).to.be.a('number');
    expect(server.addr.port).to.not.eql(0);

    // Accept either the raw listen-url (0.0.0.0/::) or a client-safe loopback,
    // but ensure the port matches and the URL is well-formed.
    const raw = server.url.raw;
    const u = new URL(raw);
    expect(u.port).to.eql(String(server.addr.port));
    expect(['0.0.0.0', '127.0.0.1', 'localhost', '::', '::1'].includes(u.hostname)).to.eql(true);

    await server.dispose();
    expect(server.disposed).to.eql(true);
  });

  it('fetch: default handler', async () => {
    const server = Testing.Http.server(() => new Response('Hello 👋'));

    const url = toClientUrl(server.url.join('foo'));
    const res = await fetch(url);
    // Some runtimes may canonicalize hostname; compare via normalized join.
    expect(toClientUrl(res.url)).to.eql(url);

    expect(res.status).to.eql(200);
    expect(await res.text()).to.eql('Hello 👋');
    await server.dispose();
  });

  it('Http.json →response: application/json', async () => {
    const server1 = Testing.Http.server(() => Testing.Http.json({ foo: 123 }));
    const server2 = Testing.Http.server((req) => Testing.Http.json(req, { foo: 456 }));

    const url1 = toClientUrl(server1.url.join('foo'));
    const url2 = toClientUrl(server2.url.join('bar'));
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

    const url = toClientUrl(server.url.join('foo'));
    const res = await fetch(url);

    expect(res.headers.get('content-type')).to.eql('text/plain');
    expect(await res.text()).to.eql('foobar');
    await server.dispose();
  });

  it('Http.blob → response: application/octet-stream', async () => {
    const dataIn = new Uint8Array([1, 2, 3]);
    const server = Testing.Http.server(() => Testing.Http.blob(dataIn));

    const url = toClientUrl(server.url.join('foo'));
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
