import { describe, expect, expectTypeOf, Fs, it, type t } from '../../../-test.ts';
import { route } from '../u.serve.route.ts';
import { Fixture, type FixtureCaptured } from './u.ts';

describe('serve route', () => {
  it('type-level: handler matches Hono middleware shape', () => {
    const handler = route({ dir: '/tmp' });
    expectTypeOf(handler).toEqualTypeOf<t.HttpServer.Hono.MiddlewareHandler>();
  });

  it('serves canonical Content-Type values for known extensions', async () => {
    const dir = await Fixture.makeTempDir();
    const cases = [
      ['hello.txt', 'hello world', 'text/plain; charset=UTF-8'],
      ['config.yaml', 'name: test', 'text/yaml; charset=UTF-8'],
      ['main.js', 'export {};', 'text/javascript; charset=UTF-8'],
    ] as const;

    for (const [path, body, contentType] of cases) {
      await Fixture.writeFile(dir, path, body);
      const ctx = Fixture.makeCtx(`/${path}`, {});

      const response = await route({ dir })(ctx, Fixture.makeNext());

      expect(response instanceof Response).to.eql(true);
      if (response instanceof Response) {
        expect(await response.text()).to.eql(body);
        expect(response.headers.get('content-type')).to.eql(contentType);
        expect(response.status).to.eql(200);
      }
    }
  });

  it('reports canonical bare media metadata in the JSON view', async () => {
    const dir = await Fixture.makeTempDir();
    await Fixture.writeFile(dir, 'config.yaml', 'name: test');

    const captured: { current?: FixtureCaptured } = {};
    const ctx = Fixture.makeCtx('/config.yaml?view=json', captured);

    await route({ dir })(ctx, Fixture.makeNext());

    const hit = captured.current;
    expect(hit && hit.kind).to.eql('json');
    if (hit && hit.kind === 'json') {
      expect(hit.status).to.eql(200);
      expect(hit.body).to.contain({ mime: 'text/yaml', path: '/config.yaml' });
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
    await Fixture.writeFile(dir, 'System_0.1.0_aarch64.unknown', 'binary-like');

    const ctx = Fixture.makeCtx('/System_0.1.0_aarch64.unknown', {});
    const response = await route({ dir })(ctx, Fixture.makeNext());

    expect(response instanceof Response).to.eql(true);
    if (response instanceof Response) {
      expect(response.status).to.eql(200);
      expect(response.headers.get('content-type')).to.eql('application/octet-stream');
      expect(await response.text()).to.eql('binary-like');
    }
  });

  it('preserves Range/206 responses from the shared file server', async () => {
    const dir = await Fixture.makeTempDir();
    await Fixture.writeFile(dir, 'sample.txt', '0123456789');

    const ctx = Fixture.makeCtx('/sample.txt', {}, { headers: { range: 'bytes=2-5' } });
    const response = await route({ dir })(ctx, Fixture.makeNext());

    expect(response instanceof Response).to.eql(true);
    if (response instanceof Response) {
      expect(response.status).to.eql(206);
      expect(response.headers.get('content-range')).to.eql('bytes 2-5/10');
      expect(response.headers.get('content-length')).to.eql('4');
      expect(await response.text()).to.eql('2345');
    }
  });

  it('serves `index.html` from directory root', async () => {
    const dir = await Fixture.makeTempDir();
    await Fixture.writeFile(dir, 'index.html', '<h1>Hello</h1>');

    const ctx = Fixture.makeCtx('/', {});
    const response = await route({ dir })(ctx, Fixture.makeNext());

    expect(response instanceof Response).to.eql(true);
    if (response instanceof Response) {
      expect(await response.text()).to.eql('<h1>Hello</h1>');
      expect(response.headers.get('content-type')).to.eql('text/html; charset=UTF-8');
      expect(response.status).to.eql(200);
    }
  });

  it('serves `index.html` from nested directory fallback', async () => {
    const dir = await Fixture.makeTempDir();
    await Fs.ensureDir(`${dir}/releases`);
    await Fixture.writeFile(dir, 'releases/index.html', '<h1>Releases</h1>');

    const ctx = Fixture.makeCtx('/releases', {});
    const response = await route({ dir })(ctx, Fixture.makeNext());

    expect(response instanceof Response).to.eql(true);
    if (response instanceof Response) {
      expect(await response.text()).to.eql('<h1>Releases</h1>');
      expect(response.headers.get('content-type')).to.eql('text/html; charset=UTF-8');
      expect(response.status).to.eql(200);
    }
  });
});
