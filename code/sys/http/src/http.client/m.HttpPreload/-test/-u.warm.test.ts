import { describe, expect, it, type t, Testing } from '../../../-test.ts';
import { HTTP_HEADER_MEDIA_FULL_CACHE_READY } from '../../common.ts';
import { Preload } from '../mod.ts';

const options = (origin: t.StringUrl): t.HttpPreload.Options => ({
  policy: {
    maxBytes: 2048,
    timeout: 1000,
    maxRedirects: 0,
    progressInterval: 25,
    sourceOrigins: [origin],
    credentialOrigins: [origin],
  },
});

describe('Http.Preload.warm', () => {
  it('HEAD: warms via metadata (content-length)', async () => {
    let method = '';
    const server = Testing.Http.server((req) => {
      method = req.method;
      return new Response(new Uint8Array(1234), {
        status: 200,
        headers: { 'content-length': '1234' },
      });
    });

    const url = server.url.toString();
    const res = await Preload.warm([url], options(server.url.toURL().origin));

    expect(method).to.eql('HEAD');
    expect(res.ok).to.eql(true);
    expect(res.ops.length).to.eql(1);
    expect(res.ops[0].ok).to.eql(true);
    expect(res.ops[0].status).to.eql(200);
    expect(res.ops[0].bytes).to.eql(1234);
    expect(res.ops[0].range).to.eql(undefined);

    await server.dispose();
  });

  it('Range: warms via byte-range GET', async () => {
    let method = '';
    let range = '';
    const server = Testing.Http.server((req) => {
      method = req.method;
      range = req.headers.get('range') ?? '';
      return Testing.Http.blob(new Uint8Array([1]));
    });

    const url = server.url.toString();
    const res = await Preload.warm(
      [{ url, range: { start: 0, end: 0 } }],
      options(server.url.toURL().origin),
    );

    expect(method).to.eql('GET');
    expect(range).to.eql('bytes=0-0');
    expect(res.ok).to.eql(true);
    expect(res.ops[0].ok).to.eql(true);
    expect(res.ops[0].bytes).to.eql(1);
    expect(res.ops[0].range).to.eql({ start: 0, end: 0 });
    expect(res.ops[0].fullMediaCached).to.eql(undefined);

    await server.dispose();
  });

  it('Range: reports when the safe-full media cache is ready', async () => {
    const server = Testing.Http.server(() =>
      new Response(new Uint8Array([1]), {
        status: 206,
        headers: {
          'content-range': 'bytes 0-0/1',
          [HTTP_HEADER_MEDIA_FULL_CACHE_READY]: 'true',
        },
      })
    );

    const url = server.url.toString();
    const res = await Preload.warm(
      [{ url, range: { start: 0, end: 0 } }],
      options(server.url.toURL().origin),
    );

    expect(res.ok).to.eql(true);
    expect(res.ops[0].ok).to.eql(true);
    expect(res.ops[0].fullMediaCached).to.eql(true);

    await server.dispose();
  });

  it('non-OK: returns failure record', async () => {
    const server = Testing.Http.server(() => new Response(null, { status: 404 }));
    const url = server.url.toString();

    const res = await Preload.warm([url], options(server.url.toURL().origin));
    const [op] = res.ops;

    expect(res.ok).to.eql(false);
    expect(op.ok).to.eql(false);
    expect(op.status).to.eql(404);

    await server.dispose();
  });
});
