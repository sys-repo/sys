import { type t, describe, expect, expectTypeOf, it } from '../../../-test.ts';
import { route } from '../u.serve.route.ts';
import { type FixtureCaptured, Fixture } from './u.ts';

describe('serve route', () => {
  it('type-level: handler matches Hono middleware shape', () => {
    const handler = route({ dir: '/tmp', contentTypes: ['text/plain'] });
    expectTypeOf(handler).toEqualTypeOf<t.HonoMiddlewareHandler>();
  });

  it('serves an allowed file with correct MIME', async () => {
    const dir = await Fixture.makeTempDir();
    await Fixture.writeFile(dir, 'hello.txt', 'hello world');

    const contentTypes: readonly t.ServeTool.MimeType[] = ['text/plain'];
    const handler = route({ dir, contentTypes });

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

    const contentTypes: readonly t.ServeTool.MimeType[] = ['text/plain'];
    const handler = route({ dir, contentTypes });

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

  it('returns 404 for disallowed MIME', async () => {
    const dir = await Fixture.makeTempDir();
    await Fixture.writeFile(dir, 'note.txt', 'hello');

    // Only images are allowed, but we request a .txt
    const contentTypes: readonly t.ServeTool.MimeType[] = ['image/png'];
    const handler = route({ dir, contentTypes });

    const captured: { current?: FixtureCaptured } = {};
    const ctx = Fixture.makeCtx('/note.txt', captured);

    await handler(ctx, Fixture.makeNext());

    const hit = captured.current;
    expect(hit && hit.kind).to.eql('text');
    if (hit && hit.kind === 'text') {
      expect(hit.status).to.eql(404);
    }
  });

  it('serves `index.html` from directory root when `text/html` is allowed', async () => {
    const dir = await Fixture.makeTempDir();
    await Fixture.writeFile(dir, 'index.html', '<h1>Hello</h1>');

    const contentTypes: readonly t.ServeTool.MimeType[] = ['text/html'];
    const handler = route({ dir, contentTypes });

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

  it('does not serve `index.html` when `text/html` is not allowed', async () => {
    const dir = await Fixture.makeTempDir();
    await Fixture.writeFile(dir, 'index.html', '<h1>Hello</h1>');

    // text/html is not in the allowed content types.
    const contentTypes: readonly t.ServeTool.MimeType[] = ['text/plain'];
    const handler = route({ dir, contentTypes });

    const captured: { current?: FixtureCaptured } = {};
    const ctx = Fixture.makeCtx('/', captured);

    await handler(ctx, Fixture.makeNext());

    const hit = captured.current;
    expect(hit && hit.kind).to.eql('text');
    if (hit && hit.kind === 'text') {
      expect(hit.status).to.eql(404);
      // Important: we did not serve the HTML payload.
      expect(hit.body).not.to.contain('<h1>Hello</h1>');
    }
  });
});
