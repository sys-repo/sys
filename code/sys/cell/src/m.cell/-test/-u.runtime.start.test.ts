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

  it('passes owner config plus cwd before startArgs', async () => {
    const source =
      `export const Capture = { start(args) { return { ...args, finished: Promise.resolve('done') }; } };`;
    const from = `data:application/javascript;base64,${btoa(source)}`;
    const root = await tempCell(
      'runtime-start-config-args',
      descriptor({ from, export: 'Capture' }),
    );
    await Fs.write(
      Fs.join(root, '-config/@sys.http/static.view.yaml'),
      Str.dedent(`
        dir: ./view
        value: from-config
      `).trimStart(),
      { force: true },
    );

    const cell = await Cell.load(root);
    let base: Record<string, unknown> | undefined;
    const runtime = await Cell.Runtime.start(cell, {
      trusted: ['data:'],
      startArgs(input) {
        base = input.base;
        return { ...input.base, marker: true };
      },
    });

    const started = runtime.services[0].started as Record<string, unknown>;
    expect(base).to.eql({ cwd: root, dir: './view', value: 'from-config' });
    expect(started).to.include({ cwd: root, dir: './view', value: 'from-config', marker: true });
    await Cell.Runtime.wait(runtime);
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

    runtime:
      services:
        - name: view
          from: '${from}'
          export: ${exp}
          config: ./-config/@sys.http/static.view.yaml
  `).trimStart();
}
