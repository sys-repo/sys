import { type t, describe, expect, expectTypeOf, Fs, it } from '../../../-test.ts';
import { route } from '../u.serve.route.ts';
import { type FixtureCaptured, Fixture } from './u.ts';

describe('serve route', () => {
  it('type-level: handler matches Hono middleware shape', () => {
    const handler = route({ dir: '/tmp' });
    expectTypeOf(handler).toEqualTypeOf<t.HonoMiddlewareHandler>();
  });

  it('serves a known-extension file with mapped MIME', async () => {
    const dir = await Fixture.makeTempDir();
    await Fixture.writeFile(dir, 'hello.txt', 'hello world');

    const handler = route({ dir });

    const captured: { current?: FixtureCaptured } = {};
    const ctx = Fixture.makeCtx('/hello.txt', captured);

    await handler(ctx, Fixture.makeNext());

    const hit = captured.current;
    expect(hit && hit.kind).to.eql('response');
    if (hit && hit.kind === 'response') {
      const text = new TextDecoder().decode(hit.body);
      expect(text).to.eql('hello world');
      expect(hit.headers.get('content-type')).to.eql('text/plain');
      expect(hit.status).to.eql(200);
    }
  });

  it('returns 404 for missing file', async () => {
    const dir = await Fixture.makeTempDir();

    const handler = route({ dir });

    const captured: { current?: FixtureCaptured } = {};
    const ctx = Fixture.makeCtx('/does-not-exist.txt', captured);

    await handler(ctx, Fixture.makeNext());

    const hit = captured.current;
    expect(hit && hit.kind).to.eql('text');
    if (hit && hit.kind === 'text') {
      expect(hit.status).to.eql(404);
      expect(hit.body).to.contain('404 - Not found');
    }
  });

  it('serves unknown extension with octet-stream fallback', async () => {
    const dir = await Fixture.makeTempDir();
    await Fixture.writeFile(dir, 'System_0.1.0_aarch64.dmg', 'binary-like');

    const handler = route({ dir });

    const captured: { current?: FixtureCaptured } = {};
    const ctx = Fixture.makeCtx('/System_0.1.0_aarch64.dmg', captured);

    await handler(ctx, Fixture.makeNext());

    const hit = captured.current;
    expect(hit && hit.kind).to.eql('response');
    if (hit && hit.kind === 'response') {
      expect(hit.status).to.eql(200);
      expect(hit.headers.get('content-type')).to.eql('application/octet-stream');
    }
  });

  it('serves `index.html` from directory root', async () => {
    const dir = await Fixture.makeTempDir();
    await Fixture.writeFile(dir, 'index.html', '<h1>Hello</h1>');

    const handler = route({ dir });

    const captured: { current?: FixtureCaptured } = {};
    const ctx = Fixture.makeCtx('/', captured);

    await handler(ctx, Fixture.makeNext());

    const hit = captured.current;
    expect(hit && hit.kind).to.eql('response');
    if (hit && hit.kind === 'response') {
      const text = new TextDecoder().decode(hit.body);
      expect(text).to.eql('<h1>Hello</h1>');
      expect(hit.headers.get('content-type')).to.eql('text/html');
      expect(hit.status).to.eql(200);
    }
  });

  it('serves `index.html` from nested directory fallback', async () => {
    const dir = await Fixture.makeTempDir();
    await Fs.ensureDir(`${dir}/releases`);
    await Fixture.writeFile(dir, 'releases/index.html', '<h1>Releases</h1>');

    const handler = route({ dir });

    const captured: { current?: FixtureCaptured } = {};
    const ctx = Fixture.makeCtx('/releases', captured);

    await handler(ctx, Fixture.makeNext());

    const hit = captured.current;
    expect(hit && hit.kind).to.eql('response');
    if (hit && hit.kind === 'response') {
      const text = new TextDecoder().decode(hit.body);
      expect(text).to.eql('<h1>Releases</h1>');
      expect(hit.headers.get('content-type')).to.eql('text/html');
      expect(hit.status).to.eql(200);
    }
  });
});
