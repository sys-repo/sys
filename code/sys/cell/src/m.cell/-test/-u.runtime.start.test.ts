import { describe, expect, Fs, it, Str } from '../../-test.ts';
import { Cell } from '../mod.ts';
import { tempCell } from './u.fixture.ts';

describe('Cell.Runtime.start', () => {
  it('starts runtime services and closes them', async () => {
    const force = true;
    const root = await tempCell('runtime-start-static', descriptor());
    await Fs.write(Fs.join(root, 'view/hello/index.html'), '<h1>Hello runtime</h1>', { force });
    await Fs.write(Fs.join(root, '-config/@sys.http/static.view.yaml'), staticConfig(), { force });

    const cell = await Cell.load(root);
    const runtime = await Cell.Runtime.start(cell);

    try {
      expect(runtime.services.map((service) => service.service.name)).to.eql(['view']);
      const server = runtime.services[0].started as { readonly origin: string };
      const res = await fetch(`${server.origin}/view/hello/`);
      const html = await res.text();
      expect(res.status).to.eql(200);
      expect(html).to.contain('Hello runtime');
    } finally {
      await runtime.close('test');
    }
  });

  it('fails clearly when a service start fails', async () => {
    const source = `export const Failing = { start() { throw new Error('boom'); } };`;
    const from = `data:application/javascript;base64,${btoa(source)}`;
    const root = await tempCell('runtime-start-fails', descriptor({ from, export: 'Failing' }));
    await Fs.write(Fs.join(root, '-config/@sys.http/static.view.yaml'), `dir: .\n`, {
      force: true,
    });

    const cell = await Cell.load(root);
    let error: Error | undefined;
    try {
      await Cell.Runtime.start(cell, { trusted: ['data:'] });
    } catch (err) {
      error = err as Error;
    }

    expect(error?.message).to.eql("Cell.Runtime.start: failed to start service 'view'.");
  });
});

function staticConfig() {
  return Str.dedent(`
    dir: .
    port: 0
    hostname: 127.0.0.1
    silent: true
  `).trimStart();
}

function descriptor(overrides: Partial<{ from: string; export: string }> = {}) {
  const from = overrides.from ?? '@sys/http/server/static';
  const exp = overrides.export ?? 'HttpStatic';

  return Str.dedent(`
    kind: cell
    version: 1

    dsl:
      root: ./data

    views:
      hello:
        source:
          local: ./view/hello

    runtime:
      services:
        - name: view
          kind: http-static
          for:
            views: [hello]
          from: '${from}'
          export: ${exp}
          config: ./-config/@sys.http/static.view.yaml
  `).trimStart();
}
