import { describe, expect, Fs, it, Path, Str, type t, Time } from '../../-test.ts';
import { Cell } from '../mod.ts';
import { tempCell } from './u.fixture.ts';
import { Controlled } from './u.service.fixture.ts';

describe('Cell service startup prerequisites', () => {
  const releaseOrders = [
    ['default', 'view', 'fixture'],
    ['dev', 'fixture', 'view'],
  ] as const;
  for (const [mode, first, last] of releaseOrders) {
    it(`${mode}: ${first} resolves first → proxy still waits for ${last}`, async () => {
      const proxy = service('proxy', ['view', 'fixture']);
      const view = service('view');
      for (const entry of [proxy, view]) {
        const { use, from, name } = entry;
        entry.variants = { dev: { use, from, config: `./${name}-dev` } };
      }
      const suffix = mode === 'dev' ? '-dev' : '';
      const parents = { view: gate(`view${suffix}`), fixture: gate('fixture') };
      const slow = gate('slow');
      const witness = gate('witness');
      const front = gate(`proxy${suffix}`);
      const downstream = gate('downstream');
      const calls = observe(parents.view, parents.fixture, slow, witness, front, downstream);
      const cell = cellOf(
        service('downstream', ['proxy']),
        proxy,
        service('witness', [first]),
        view,
        service('fixture'),
        service('slow'),
      );
      const started = Cell.Services.start(cell, { mode });
      await Promise.all([parents.view, parents.fixture, slow].map((item) => item.entered.promise));
      parents[first].result.resolve({});
      await witness.entered.promise; // Cell accepted the first prerequisite; the other is held.
      expect(calls).not.to.include(front.name);
      parents[last].result.resolve({});
      const args = await front.entered.promise;
      expect(args).not.to.have.property('startAfter');
      expect(calls).not.to.include(downstream.name);
      front.result.resolve({});
      await downstream.entered.promise;
      expect(calls.filter((name) => name === front.name)).to.eql([front.name]);
      for (const item of [slow, witness, downstream]) item.result.resolve({});

      const batch = await started;
      const names = batch.services.map(({ service }) => service.name);
      expect(names).to.eql(['downstream', 'proxy', 'witness', 'view', 'fixture', 'slow']);
      expect(batch.services[1].service.startAfter).to.eql(['view', 'fixture']);
      await batch.close();
    });
  }

  it('invalid edges introduced after load fail before any start', async () => {
    const yaml = Str.dedent(`
      kind: cell
      version: 1
    `);
    const root = await tempCell('invalid-start-after', yaml);
    const endpoint = import.meta.resolve('./u.service.fixture.ts');
    const fixturePath = Fs.join(root, 'u.service.fixture.ts');
    await Fs.write(fixturePath, `export { Controlled } from '${endpoint}';`);
    const cell = await Cell.load(root);
    const calls = observe();
    const cases = [
      [['missing'], [], '/services/0/startAfter/0', 'Unknown service prerequisite: missing'],
      [['api', 'api'], [], '/services/0/startAfter/1', 'Repeated service prerequisite: api'],
      [['web'], [], '/services/0/startAfter/0', 'Service cannot start after itself: web'],
      [['api'], ['web'], '/services/1/startAfter/0', 'Service startup cycle: web → api → web'],
    ] as const;
    for (const [webAfter, apiAfter, path, message] of cases) {
      cell.descriptor.services = [service('web', webAfter), service('api', apiAfter)];
      const issue = Cell.Schema.Descriptor.validate(cell.descriptor).errors[0];
      expect(issue).to.eql({ kind: 'semantic', path, message });
      const failure = await startFailure(cell);
      expect(failure.message).to.include(`${path}: ${message}`);
      expect(calls).to.eql([]);
    }
  });

  for (const ref of ['front', 'missing']) {
    it(`variant startup edge to '${ref}' → reject in plan and start before any endpoint call`, async () => {
      const yaml = Str.dedent(`
        kind: cell
        version: 1
        services:
          - name: front
            use: Controlled
            from: ./u.service.fixture.ts
            config: ./front
            variants:
              dev:
                use: Controlled
                from: ./u.service.fixture.ts
                config: ./front
      `);
      const root = await tempCell('invalid-variant-start-after', yaml);
      const endpoint = import.meta.resolve('./u.service.fixture.ts');
      await Fs.write(
        Fs.join(root, 'u.service.fixture.ts'),
        `export { Controlled } from '${endpoint}';`,
      );
      const cell = await Cell.load(root);
      const dev = cell.descriptor.services![0].variants!.dev;
      Object.assign(dev, { startAfter: [ref] });

      const path = '/services/0/variants/dev/startAfter';
      const issue = Cell.Schema.Descriptor.validate(cell.descriptor).errors[0];
      expect(issue.path).to.eql(path);
      const front = gate('front');
      const calls = observe(front);
      front.result.resolve({});
      const mode = { mode: 'dev' } as const;
      const outcomes = await Promise.allSettled([
        Cell.Services.plan(cell, mode),
        within(Cell.Services.start(cell, mode), 'Start did not reject the variant edge'),
      ]);
      expect(calls, 'endpoint calls').to.eql([]);
      for (const [index, operation] of ['plan', 'start'].entries()) {
        const outcome = outcomes[index];
        if (outcome.status === 'fulfilled') throw new Error(`Expected ${operation} to reject`);
        expect(outcome.reason.message, operation).to.include(`${path}: ${issue.message}`);
      }
    });
  }

  it('handle returned during rollback → close it while the sibling drains', async () => {
    const late = gate('late');
    const drain = gate('drain');
    const fail = gate('fail');
    observe(late, drain, fail);
    const cell = cellOf(service('late'), service('drain'), service('fail', ['drain']));
    const failed = startFailure(cell);
    const lateClosed = Promise.withResolvers<void>();
    const closes: [name: string, reason: unknown][] = [];
    await Promise.all([late.entered.promise, drain.entered.promise]);
    drain.result.resolve({
      async close(reason: unknown) {
        closes.push(['drain', reason]);
        late.result.resolve({
          close(reason: unknown) {
            closes.push(['late', reason]);
            lateClosed.resolve();
          },
        });
        await lateClosed.promise;
      },
    });
    await fail.entered.promise;
    const error = new Error('owner failed');
    fail.result.reject(error);

    try {
      const failure = await within(
        failed,
        'Rollback waited for the late handle without closing it',
      );
      expect(failure.message).to.include("failed to start service 'fail'");
      expect(failure.cause).to.equal(error);
      expect(closes.map(([name]) => name)).to.eql(['drain', 'late']);
      for (const [, reason] of closes) expect(reason).to.equal(error);
    } finally {
      lateClosed.resolve(); // Release the fixture even if the guard detects a deadlock.
    }
  });

  it('cancellation at handle handoff → close the returned handle exactly once', async () => {
    const until = new AbortController();
    const closed: unknown[] = [];
    const calls: string[] = [];
    Controlled.start = (args) => {
      calls.push(Path.basename(args.paths.config));
      // Let the endpoint return and its promise observers run, then cancel before acceptance.
      queueMicrotask(() => queueMicrotask(() => queueMicrotask(() => until.abort('stop'))));
      return { close: (reason: unknown) => closed.push(reason) };
    };
    const cell = cellOf(service('front', ['upstream']), service('upstream'));
    const failure = await startFailure(cell, { until: until.signal });
    expect(failure.message).to.include("failed to start service 'upstream'");
    expect(failure.cause).to.eql('stop');
    expect(calls).to.eql(['upstream']);
    expect(closed).to.eql(['stop']);
  });

  for (const outcome of ['failure', 'timeout']) {
    it(`${outcome}: retain the cause, close acquired and late handles, never start dependents`, async () => {
      const acquired = gate('acquired');
      const late = gate('late');
      const failing = gate('failing');
      const calls = observe(acquired, late, failing);
      const cell = cellOf(
        service('front', ['failing']),
        { ...service('failing', ['acquired']), timeout: outcome === 'timeout' ? 25 : 1_000 },
        service('late'),
        service('acquired'),
      );
      const failed = startFailure(cell);
      const closed: unknown[] = [];
      const cleanupError = new Error('cleanup failed');
      await Promise.all([late.entered.promise, acquired.entered.promise]);
      acquired.result.resolve({
        close(reason: unknown) {
          closed.push(reason);
          throw cleanupError;
        },
      });
      await failing.entered.promise;
      const error = new Error('owner failed');
      if (outcome === 'failure') failing.result.reject(error);
      const failure = await failed;
      expect(failure.message).to.include("failed to start service 'failing'");
      const causes = failure.cause;
      if (!(causes instanceof AggregateError)) throw failure;
      const [primary, cleanup] = causes.errors;
      if (outcome === 'failure') expect(primary).to.equal(error);
      else expect(primary.message).to.include('startup timed out');
      expect(cleanup).to.equal(cleanupError);
      expect(closed).to.eql([primary]);

      const released = Promise.withResolvers<void>();
      late.result.resolve({
        close(reason: unknown) {
          closed.push(reason);
          released.resolve();
        },
      });
      await released.promise;
      expect(closed).to.eql([primary, primary]);
      expect(calls).not.to.include('front');
    });
  }
});

function gate(name: string) {
  return {
    name,
    entered: Promise.withResolvers<t.Cell.Services.StartArgs>(),
    result: Promise.withResolvers<unknown>(),
  };
}

function observe(...gates: ReturnType<typeof gate>[]) {
  const calls: string[] = [];
  Controlled.start = (args) => {
    const name = Path.basename(args.paths.config);
    calls.push(name);
    const item = gates.find((gate) => gate.name === name);
    if (!item) throw new Error(`Unexpected start: ${name}`);
    item.entered.resolve(args);
    return item.result.promise;
  };
  return calls;
}

function service(name: string, startAfter?: readonly string[]): t.Cell.Services.Service {
  return {
    name,
    use: 'Controlled',
    from: './u.service.fixture.ts',
    config: `./${name}`,
    ...(startAfter && { startAfter }),
  };
}

function cellOf(...services: t.Cell.Services.Service[]): t.Cell.Instance {
  return {
    root: import.meta.dirname!,
    paths: { descriptor: 'cell.yaml' },
    descriptor: { kind: 'cell', version: 1, services },
  };
}

async function within<T>(operation: Promise<T>, message: string) {
  const expired = Promise.withResolvers<never>();
  const guard = Time.delay(1_000, () => expired.reject(new Error(message)));
  try {
    return await Promise.race([operation, expired.promise]);
  } finally {
    guard.cancel();
  }
}

async function startFailure(cell: t.Cell.Instance, options?: t.Cell.Services.StartOptions) {
  try {
    await Cell.Services.start(cell, options);
  } catch (cause) {
    if (cause instanceof Error) return cause;
    throw cause;
  }
  throw new Error('Expected startup failure');
}
