import { Testing, describe, expect, it } from '../../../-test.ts';
import { Preload } from '../mod.ts';

describe('Http.Preload.warm', () => {
  it('HEAD: warms via metadata (content-length)', async () => {
    let method = '';
    const server = Testing.Http.server((req) => {
      method = req.method;
      return new Response(null, { status: 200, headers: { 'content-length': '1234' } });
    });

    const url = server.url.toString();
    const res = await Preload.warm([url]);

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
    const res = await Preload.warm([{ url, range: { start: 0, end: 0 } }]);

    expect(method).to.eql('GET');
    expect(range).to.eql('bytes=0-0');
    expect(res.ok).to.eql(true);
    expect(res.ops[0].ok).to.eql(true);
    expect(res.ops[0].bytes).to.eql(1);
    expect(res.ops[0].range).to.eql({ start: 0, end: 0 });

    await server.dispose();
  });

  it('non-OK: returns failure record', async () => {
    const server = Testing.Http.server(() => new Response(null, { status: 404 }));
    const url = server.url.toString();

    const res = await Preload.warm([url]);
    const [op] = res.ops;

    expect(res.ok).to.eql(false);
    expect(op.ok).to.eql(false);
    expect(op.status).to.eql(404);

    await server.dispose();
  });
});
