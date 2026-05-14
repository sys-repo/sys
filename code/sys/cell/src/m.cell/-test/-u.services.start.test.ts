import { describe, expect, Fs, it, Str, type t, Time } from '../../-test.ts';
import { Cell } from '../mod.ts';
import { tempCell } from './u.fixture.ts';

describe('Cell.Services.start', () => {
  it('starts services and closes them', async () => {
    const force = true;
    const root = await tempCell('services-start-static', descriptor());
    await Fs.write(Fs.join(root, 'view/hello/index.html'), '<h1>Hello services</h1>', { force });
    await Fs.write(Fs.join(root, '-config/@sys.http/static.view.yaml'), staticConfig(), { force });

    const cell = await Cell.load(root);
    const before = Time.now.timestamp;
    const started = await Cell.Services.start(cell);
    const after = Time.now.timestamp;

    try {
      expect(started.services.map((service) => service.service.name)).to.eql(['view']);
      const metrics = started.services[0].metrics.start;
      const duration = (metrics.resolvedAt - metrics.startedAt) as t.Msecs;
      expect(metrics.startedAt).to.be.at.least(before);
      expect(metrics.resolvedAt).to.be.at.least(metrics.startedAt);
      expect(metrics.resolvedAt).to.be.at.most(after);
      expect(duration).to.be.at.least(0);
      expect(started.services[0].metrics).to.not.have.property('duration');
      expect(started.services[0].metrics.start).to.not.have.property('readyAt');
      const server = started.services[0].handle as { readonly origin: string };
      const res = await fetch(`${server.origin}/view/hello/`);
      const html = await res.text();
      expect(res.status).to.eql(200);
      expect(html).to.contain('Hello services');
    } finally {
      await started.close('test');
    }
  });

  it('passes config refs, cwd, and Cell-owned quieting to service endpoints', async () => {
    const source =
      `export const Capture = { start(args) { return { ...args, finished: Promise.resolve('done') }; } };`;
    const from = `data:application/javascript;base64,${btoa(source)}`;
    const root = await tempCell(
      'services-start-config-args',
      descriptor({ from, use: 'Capture' }),
    );
    await Fs.write(
      Fs.join(root, '-config/@sys.http/static.view.yaml'),
      Str.dedent(`
        value: bad:
      `).trimStart(),
      { force: true },
    );

    const cell = await Cell.load(root);
    const started = await Cell.Services.start(cell, { trusted: ['data:'] });

    const handle = started.services[0].handle as Record<string, unknown>;
    const config = Fs.join(root, '-config/@sys.http/static.view.yaml');
    expect(handle.cwd).to.eql(root);
    expect(handle.paths).to.eql({ config });
    expect(handle.silent).to.eql(true);
    expect(handle).to.not.have.property('config');
    await Cell.Services.wait(started);
  });

  it('passes lifecycle until to service endpoints when provided', async () => {
    const source =
      `export const Capture = { start(args) { return { ...args, finished: Promise.resolve('done') }; } };`;
    const from = `data:application/javascript;base64,${btoa(source)}`;
    const root = await tempCell('services-start-until', descriptor({ from, use: 'Capture' }));
    await Fs.write(Fs.join(root, '-config/@sys.http/static.view.yaml'), `dir: .\n`, {
      force: true,
    });
    const until = new AbortController().signal;

    const started = await Cell.Services.start(await Cell.load(root), { trusted: ['data:'], until });

    const handle = started.services[0].handle as Record<string, unknown>;
    expect(handle.until).to.equal(until);
    await Cell.Services.wait(started);
  });

  it('root Cell.start delegates to services start', async () => {
    const source =
      `export const Capture = { start(args) { return { ...args, finished: Promise.resolve('done') }; } };`;
    const from = `data:application/javascript;base64,${btoa(source)}`;
    const root = await tempCell('services-root-start', descriptor({ from, use: 'Capture' }));
    await Fs.write(Fs.join(root, '-config/@sys.http/static.view.yaml'), `dir: .\n`, {
      force: true,
    });

    const cell = await Cell.load(root);
    const started = await Cell.start(cell, { trusted: ['data:'] });
    expect(started.services.map((service) => service.service.name)).to.eql(['view']);
    await Cell.Services.wait(started);
  });

  it('closes started services in reverse order with the shutdown reason', async () => {
    resetServiceEvents();
    const source = Str.dedent(`
      const events = globalThis.__cellServiceEvents ??= [];
      export const First = { start() { events.push('start:first'); return { close(reason) { events.push(\`close:first:\${reason}\`); } }; } };
      export const Second = { start() { events.push('start:second'); return { close(reason) { events.push(\`close:second:\${reason}\`); } }; } };
    `).trimStart();
    const from = `data:application/javascript;base64,${btoa(source)}`;
    const root = await tempCell('services-close-reverse', twoServiceDescriptor(from));

    const started = await Cell.Services.start(await Cell.load(root), { trusted: ['data:'] });
    await started.close('shutdown');

    expect(serviceEvents()).to.eql([
      'start:first',
      'start:second',
      'close:second:shutdown',
      'close:first:shutdown',
    ]);
  });

  it('closes all previously started services when a later service fails', async () => {
    resetServiceEvents();
    const source = Str.dedent(`
      const events = globalThis.__cellServiceEvents ??= [];
      export const First = {
        start() {
          events.push('start:first');
          return { close() { events.push('close:first'); throw new Error('close:first'); } };
        },
      };
      export const Second = {
        start() {
          events.push('start:second');
          return { close() { events.push('close:second'); } };
        },
      };
      export const Failing = { start() { events.push('start:fail'); throw new Error('boom'); } };
    `).trimStart();
    const from = `data:application/javascript;base64,${btoa(source)}`;
    const root = await tempCell('services-start-cleanup-all', multiServiceDescriptor(from));

    const cell = await Cell.load(root);
    let error: Error | undefined;
    try {
      await Cell.Services.start(cell, { trusted: ['data:'] });
    } catch (err) {
      error = err as Error;
    }

    expect(error?.message).to.eql("Cell.Services.start: failed to start service 'fail'.");
    expect(error?.cause).to.be.instanceOf(AggregateError);
    expect(serviceEvents()).to.eql([
      'start:first',
      'start:second',
      'start:fail',
      'close:second',
      'close:first',
    ]);
  });

  it('fails clearly when a service start fails', async () => {
    const source = `export const Failing = { start() { throw new Error('boom'); } };`;
    const from = `data:application/javascript;base64,${btoa(source)}`;
    const root = await tempCell('services-start-fails', descriptor({ from, use: 'Failing' }));
    await Fs.write(Fs.join(root, '-config/@sys.http/static.view.yaml'), `dir: .\n`, {
      force: true,
    });

    const cell = await Cell.load(root);
    let error: Error | undefined;
    try {
      await Cell.Services.start(cell, { trusted: ['data:'] });
    } catch (err) {
      error = err as Error;
    }

    expect(error?.message).to.eql("Cell.Services.start: failed to start service 'view'.");
  });
});

/**
 * Helpers:
 */
function staticConfig() {
  return Str.dedent(`
    name: view
    dir: .
    port: 0
    hostname: 127.0.0.1
    silent: true
  `).trimStart();
}

function descriptor(overrides: Partial<{ use: string; from: string }> = {}) {
  const from = overrides.from ?? '@sys/http/server/static';
  const use = overrides.use ?? 'HttpStatic';
  return Str.dedent(`
    kind: cell
    version: 1

    services:
      - name: view
        use: ${use}
        from: '${from}'
        config: ./-config/@sys.http/static.view.yaml
  `).trimStart();
}

function twoServiceDescriptor(from: string) {
  return Str.dedent(`
    kind: cell
    version: 1

    services:
      - name: first
        use: First
        from: '${from}'
        config: ./-config/first.yaml
      - name: second
        use: Second
        from: '${from}'
        config: ./-config/second.yaml
  `).trimStart();
}

function multiServiceDescriptor(from: string) {
  return Str.dedent(`
    kind: cell
    version: 1

    services:
      - name: first
        use: First
        from: '${from}'
        config: ./-config/first.yaml
      - name: second
        use: Second
        from: '${from}'
        config: ./-config/second.yaml
      - name: fail
        use: Failing
        from: '${from}'
        config: ./-config/fail.yaml
  `).trimStart();
}

type ServiceGlobal = typeof globalThis & { __cellServiceEvents?: string[] };

function resetServiceEvents() {
  (globalThis as ServiceGlobal).__cellServiceEvents = [];
}

function serviceEvents(): readonly string[] {
  return (globalThis as ServiceGlobal).__cellServiceEvents ?? [];
}
