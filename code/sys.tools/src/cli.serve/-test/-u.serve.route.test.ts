import { type t, describe, expect, expectTypeOf, it } from '../../-test.ts';
import { route } from '../u.serve.route.ts';
import { type Captured, Fixture } from './u.fixture.ts';

describe('serve route', () => {
  it('serves an allowed file with correct MIME', async () => {
    const dir = await Fixture.makeTempDir();
    await Fixture.writeFile(dir, 'hello.txt', 'hello world');

    const contentTypes: readonly t.MimeType[] = ['text/plain'];
    const handler = route({ dir, contentTypes });

    const captured: { current?: Captured } = {};
    const ctx = Fixture.makeCtx('/hello.txt', captured);

    await handler(ctx, Fixture.makeNext());

    const hit = captured.current;
    expect(hit && hit.kind).to.equal('response');
    if (hit && hit.kind === 'response') {
      const text = new TextDecoder().decode(hit.body);
      expect(text).to.equal('hello world');
      expect(hit.headers.get('content-type')).to.equal('text/plain');
      expect(hit.status).to.equal(200);
    }
  });

  it('returns 404 for missing file', async () => {
    const dir = await Fixture.makeTempDir();

    const contentTypes: readonly t.MimeType[] = ['text/plain'];
    const handler = route({ dir, contentTypes });

    const captured: { current?: Captured } = {};
    const ctx = Fixture.makeCtx('/does-not-exist.txt', captured);

    await handler(ctx, Fixture.makeNext());

    const hit = captured.current;
    expect(hit && hit.kind).to.equal('text');
    if (hit && hit.kind === 'text') {
      expect(hit.status).to.equal(404);
      expect(hit.body).to.contain('404 - Not found');
    }
  });

  it('returns 404 for disallowed MIME', async () => {
    const dir = await Fixture.makeTempDir();
    await Fixture.writeFile(dir, 'note.txt', 'hello');

    // Only images are allowed, but we request a .txt
    const contentTypes: readonly t.MimeType[] = ['image/png'];
    const handler = route({ dir, contentTypes });

    const captured: { current?: Captured } = {};
    const ctx = Fixture.makeCtx('/note.txt', captured);

    await handler(ctx, Fixture.makeNext());

    const hit = captured.current;
    expect(hit && hit.kind).to.equal('text');
    if (hit && hit.kind === 'text') {
      expect(hit.status).to.equal(404);
    }
  });

  it('type-level: handler matches Hono middleware shape', () => {
    const handler = route({ dir: '/tmp', contentTypes: ['text/plain'] });
    expectTypeOf(handler).toEqualTypeOf<t.HonoMiddlewareHandler>();
  });
});
