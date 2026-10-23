import { describe, expect, Fs, it, Str, type t, Time } from '../../-test.ts';
import { D } from '../common.ts';
import { Cell } from '../mod.ts';
import { tempCell } from './u.fixture.ts';
import {
  resetParallelResolvers,
  resetServiceEvents,
  resolveParallel,
  ServiceEndpointFixture,
  serviceEvents,
} from './u.service.fixture.ts';

describe('Cell.Services.start', () => {
  describe('public surface', () => {
    it('defines the default per-service startup timeout', () => {
      expect(D.services.start.timeout).to.eql(10_000);
    });

    it('root Cell.start delegates to services start', async () => {
      const root = await tempCell(
        'services-root-start',
        descriptor({ from: ServiceEndpointFixture.captureArgs(), use: 'Capture' }),
      );
      await Fs.write(Fs.join(root, '-config/@sys.http/static.view.yaml'), `dir: .\n`, {
        force: true,
      });

      const cell = await Cell.load(root);
      const started = await Cell.start(cell, { trusted: ['data:'] });
      expect(started.services.map((service) => service.service.name)).to.eql(['view']);
      await Cell.Services.wait(started);
    });
  });

  describe('activation contract', () => {
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
      const root = await tempCell(
        'services-start-config-args',
        descriptor({ from: ServiceEndpointFixture.captureArgs(), use: 'Capture' }),
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

    it('starts selected mode variants with selected config refs', async () => {
      const from = ServiceEndpointFixture.variantArgs();
      const root = await tempCell('services-start-mode-variant', variantDescriptor({ from }));
      const cell = await Cell.load(root);

      const started = await Cell.Services.start(cell, { mode: 'dev', trusted: ['data:'] });
      const service = started.services[0];
      const handle = service.handle as Record<string, unknown>;

      expect(service.service).to.eql({
        name: 'view',
        use: 'Variant',
        from,
        config: './-config/view.dev.yaml',
      });
      expect(service.selection.variant).to.eql('dev');
      expect(service.selection.descriptor.from).to.eql('npm:untrusted-base');
      expect(handle.cwd).to.eql(root);
      expect(handle.paths).to.eql({ config: Fs.join(root, '-config/view.dev.yaml') });
      await Cell.Services.wait(started);
    });

    it('passes lifecycle until to service endpoints when provided', async () => {
      const root = await tempCell(
        'services-start-until',
        descriptor({ from: ServiceEndpointFixture.captureArgs(), use: 'Capture' }),
      );
      await Fs.write(Fs.join(root, '-config/@sys.http/static.view.yaml'), `dir: .\n`, {
        force: true,
      });
      const until = new AbortController();

      const started = await Cell.Services.start(await Cell.load(root), {
        trusted: ['data:'],
        until: until.signal,
      });

      const handle = started.services[0].handle as Record<string, unknown>;
      expect(handle.until).to.be.instanceOf(AbortSignal);
      expect(handle.until).to.not.equal(until.signal);

      until.abort('operator-stop');
      await Time.wait(0);
      expect((handle.until as AbortSignal).aborted).to.eql(true);
      expect((handle.until as AbortSignal).reason).to.eql('operator-stop');
      await Cell.Services.wait(started);
    });
  });

  describe('service ordering and cleanup', () => {
    it('starts selected services concurrently while preserving descriptor-order results', async () => {
      resetServiceEvents();
      resetParallelResolvers();
      const from = ServiceEndpointFixture.parallel();
      const root = await tempCell('services-start-parallel', twoServiceDescriptor(from));

      const promise = Cell.Services.start(await Cell.load(root), { trusted: ['data:'] });
      await Time.waitFor(() => {
        const events = serviceEvents();
        return events.includes('start:first') && events.includes('start:second');
      }, { timeout: 1_000, interval: 10 });

      expect(serviceEvents()).to.eql(['start:first', 'start:second']);
      resolveParallel('second');
      resolveParallel('first');

      const started = await promise;
      expect(started.services.map((service) => service.service.name)).to.eql(['first', 'second']);
      await started.close('done');
    });

    it('closes started services in reverse order with the shutdown reason', async () => {
      resetServiceEvents();
      const from = ServiceEndpointFixture.closeReverse();
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
      const from = ServiceEndpointFixture.cleanupAfterFailure();
      const root = await tempCell('services-start-cleanup-all', multiServiceDescriptor(from));

      const error = await catchStart(async () => {
        const cell = await Cell.load(root);
        return await Cell.Services.start(cell, { trusted: ['data:'] });
      });

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
  });

  describe('startup failure boundaries', () => {
    it('fails clearly when a service start fails', async () => {
      const root = await tempCell(
        'services-start-fails',
        descriptor({ from: ServiceEndpointFixture.failingStart(), use: 'Failing' }),
      );
      await Fs.write(Fs.join(root, '-config/@sys.http/static.view.yaml'), `dir: .\n`, {
        force: true,
      });

      const error = await catchStart(async () => {
        const cell = await Cell.load(root);
        return await Cell.Services.start(cell, { trusted: ['data:'] });
      });

      expect(error?.message).to.eql("Cell.Services.start: failed to start service 'view'.");
    });

    it('times out a service endpoint import that exceeds startup timeout', async () => {
      const root = await tempCell(
        'services-start-timeout-import',
        descriptor({ use: 'SlowImport', from: './-services/slow-import.ts', timeout: 20 }),
      );
      await Fs.write(
        Fs.join(root, '-services/slow-import.ts'),
        Str.dedent(`
          import { Time } from '@sys/std/time';
          await Time.delay(50);
          export const SlowImport = { start() { return { finished: Promise.resolve('done') }; } };
        `).trimStart(),
        { force: true },
      );

      const error = await catchStart(async () => {
        const cell = await Cell.load(root);
        return await Cell.Services.start(cell);
      });

      expect(error?.message).to.eql("Cell.Services.start: failed to start service 'view'.");
      expect((error?.cause as Error | undefined)?.message).to.contain('startup timed out after');
      await Time.wait(60);
    });

    it('times out a service start that never resolves', async () => {
      const root = await tempCell(
        'services-start-timeout-start',
        descriptor({ from: ServiceEndpointFixture.hangingStart(), use: 'Hanging', timeout: 20 }),
      );

      const error = await catchStart(async () => {
        const cell = await Cell.load(root);
        return await Cell.Services.start(cell, { trusted: ['data:'] });
      });

      expect(error?.message).to.eql("Cell.Services.start: failed to start service 'view'.");
      expect((error?.cause as Error | undefined)?.message).to.contain('startup timed out after');
    });

    it('caller until cancels service startup', async () => {
      resetServiceEvents();
      const root = await tempCell(
        'services-start-cancel',
        descriptor({ from: ServiceEndpointFixture.cancelableHanging(), use: 'Hanging' }),
      );
      const until = new AbortController();

      const promise = Cell.Services.start(await Cell.load(root), {
        trusted: ['data:'],
        timeout: 1_000,
        until: until.signal,
      });
      await Time.waitFor(() => serviceEvents().includes('start:view'), {
        timeout: 1_000,
        interval: 10,
      });

      until.abort('operator-stop');
      const error = await catchStart(() => promise);

      expect(error?.message).to.eql("Cell.Services.start: failed to start service 'view'.");
      expect(error?.cause).to.eql('operator-stop');
    });

    it('closes a late handle that resolves after startup timeout', async () => {
      resetServiceEvents();
      resetParallelResolvers();
      const root = await tempCell(
        'services-start-late-handle-cleanup',
        descriptor({ from: ServiceEndpointFixture.lateHandle(), use: 'Slow', timeout: 20 }),
      );

      const error = await catchStart(async () => {
        const cell = await Cell.load(root);
        return await Cell.Services.start(cell, { trusted: ['data:'] });
      });
      expect(error?.message).to.eql("Cell.Services.start: failed to start service 'view'.");

      resolveParallel('slow');
      await Time.waitFor(() => serviceEvents().some((event) => event.startsWith('close:slow:')), {
        timeout: 1_000,
        interval: 10,
      });
      expect(serviceEvents().some((event) => event.includes('startup timed out after'))).to.eql(
        true,
      );
    });
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

function variantDescriptor(args: { readonly from: string }) {
  return Str.dedent(`
    kind: cell
    version: 1

    services:
      - name: view
        use: Base
        from: 'npm:untrusted-base'
        config: ./-config/base.yaml
        variants:
          dev:
            use: Variant
            from: '${args.from}'
            config: ./-config/view.dev.yaml
  `).trimStart();
}

function descriptor(overrides: Partial<{ use: string; from: string; timeout: t.Msecs }> = {}) {
  const from = overrides.from ?? '@sys/http/server/static';
  const use = overrides.use ?? 'HttpStatic';
  const timeout = overrides.timeout === undefined ? '' : `timeout: ${overrides.timeout}`;
  return Str.dedent(`
    kind: cell
    version: 1

    services:
      - name: view
        use: ${use}
        from: '${from}'
        config: ./-config/@sys.http/static.view.yaml
        ${timeout}
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

async function catchStart(fn: () => Promise<unknown>): Promise<Error | undefined> {
  try {
    await fn();
  } catch (err) {
    return err as Error;
  }
}
