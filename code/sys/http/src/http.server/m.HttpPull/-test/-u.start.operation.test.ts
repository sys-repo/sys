import { afterEach, describe, expect, Fs, it, Rx, type t, Testing, Time } from '../../../-test.ts';
import { HttpPull } from '../mod.ts';
import {
  cleanupRoots,
  localhost,
  resource,
  resourcePolicy,
  rooted,
  rootedFailure,
} from './u.fixture.ts';

function start(
  resources: readonly t.HttpPull.Resource[],
  owner: t.Fs.Rooted.Instance,
  policy: t.HttpPull.ResourcePolicy = resourcePolicy(resources),
  until?: t.UntilInput,
): t.HttpPull.ResourceOperation.Instance {
  return HttpPull.start({ resources, rooted: owner, policy, until });
}

function pendingServer(content = 'late') {
  let requestedResolve!: () => void;
  let releaseResolve!: () => void;
  let handledResolve!: () => void;
  const requested = new Promise<void>((resolve) => requestedResolve = resolve);
  const released = new Promise<void>((resolve) => releaseResolve = resolve);
  const handled = new Promise<void>((resolve) => handledResolve = resolve);
  const server = Testing.Http.server(async (request) => {
    requestedResolve();
    await released;
    handledResolve();
    return Testing.Http.text(request, content);
  });
  return { server, requested, release: releaseResolve, handled };
}

function asFailure(record: t.HttpPull.ResourceRecord): t.HttpPull.ResourceRecordFailure {
  if (record.ok) throw new Error('Expected checksum-pinned Pull failure');
  return record;
}

describe('HttpPull.start cancellation and terminal ownership', () => {
  afterEach(cleanupRoots);

  it('honors a pre-aborted lifecycle before Rooted admission or transport', async () => {
    let admissions = 0;
    let requests = 0;
    const server = Testing.Http.server((request) => {
      requests++;
      return Testing.Http.text(request, 'content');
    });
    try {
      const source = localhost(server.url.join('pre-aborted.txt'));
      const resources = [resource(source, 'pre-aborted.txt', 'content')];
      const owner = await rooted();
      const destination: t.Fs.Rooted.Instance = Object.freeze({
        ...owner,
        admit: async (targets, options) => {
          admissions++;
          return await owner.admit(targets, options);
        },
      });
      const until = new AbortController();
      until.abort('PRE-ABORT-SECRET');

      const result = await start(resources, destination, resourcePolicy(resources), until.signal)
        .done;

      expect(result.ok).to.eql(false);
      expect(result.terminal?.kind).to.eql('cancelled');
      expect(asFailure(result.ops[0]).attempts).to.eql(0);
      expect(JSON.stringify(result).includes('PRE-ABORT-SECRET')).to.eql(false);
      expect(admissions).to.eql(0);
      expect(requests).to.eql(0);
    } finally {
      await server.dispose();
    }
  });

  it('classifies explicit cancellation as canonical 499 and waits for worker quiescence', async () => {
    const pending = pendingServer();
    try {
      const source = localhost(pending.server.url.join('cancelled.txt'));
      const resources = [resource(source, 'cancelled.txt', 'late')];
      const owner = await rooted();
      const operation = start(resources, owner);
      const events: t.HttpPull.ResourceEvent.Any[] = [];
      const view = operation.events();
      const subscription = view.$.subscribe((event) => events.push(event));

      await pending.requested;
      operation.cancel('CALLER-SECRET');
      const result = await operation.done;
      subscription.unsubscribe();

      expect(result.ok).to.eql(false);
      expect(result.terminal).to.eql({
        kind: 'cancelled',
        status: 499,
        error: 'Pull operation cancelled',
        cancelled: true,
      });
      expect(asFailure(result.ops[0])).to.include({
        kind: 'cancelled',
        status: 499,
        error: 'Pull operation cancelled',
        cancelled: true,
      });
      expect(JSON.stringify([result, events]).includes('CALLER-SECRET')).to.eql(false);
      expect(events.filter((event) => event.kind === 'error')).to.have.length(1);
      expect(await Fs.exists(Fs.join(owner.path, 'cancelled.txt'))).to.eql(false);

      const eventCount = events.length;
      pending.release();
      await pending.handled;
      await Time.wait(20);
      expect(events.length).to.eql(eventCount);
      expect(await Fs.exists(Fs.join(owner.path, 'cancelled.txt'))).to.eql(false);
    } finally {
      pending.release();
      await pending.server.dispose();
    }
  });

  it('preserves lifecycle cancellation on a retry-disabled final attempt', async () => {
    const pending = pendingServer();
    try {
      const source = localhost(pending.server.url.join('lifecycle.txt'));
      const resources = [resource(source, 'lifecycle.txt', 'late')];
      const owner = await rooted();
      const until = Rx.lifecycle();
      const operation = start(
        resources,
        owner,
        resourcePolicy(resources, { maxAttempts: 1 }),
        until.dispose$,
      );

      await pending.requested;
      until.dispose('LIFECYCLE-SECRET');
      const result = await operation.done;

      expect(result.ok).to.eql(false);
      expect(result.terminal?.kind).to.eql('cancelled');
      expect(asFailure(result.ops[0]).kind).to.eql('cancelled');
      expect(asFailure(result.ops[0]).attempts).to.eql(1);
      expect(JSON.stringify(result).includes('LIFECYCLE-SECRET')).to.eql(false);
    } finally {
      pending.release();
      await pending.server.dispose();
    }
  });

  it('gives the operation total deadline first-cause authority over Fetch cancellation', async () => {
    const pending = pendingServer();
    try {
      const source = localhost(pending.server.url.join('timeout.txt'));
      const resources = [resource(source, 'timeout.txt', 'late')];
      const owner = await rooted();
      const policy = resourcePolicy(resources, {
        totalTimeout: 20,
        response: { timeout: 1000 },
      });

      const result = await start(resources, owner, policy).done;

      expect(result.ok).to.eql(false);
      expect(result.terminal).to.eql({
        kind: 'total-timeout',
        status: 408,
        error: 'Checksum-pinned pull total time limit exceeded',
      });
      expect(asFailure(result.ops[0]).kind).to.eql('total-timeout');
      expect(asFailure(result.ops[0]).cancelled).to.eql(undefined);
      expect(await Fs.exists(Fs.join(owner.path, 'timeout.txt'))).to.eql(false);

      pending.release();
      await pending.handled;
      await Time.wait(20);
      expect(await Fs.exists(Fs.join(owner.path, 'timeout.txt'))).to.eql(false);
    } finally {
      pending.release();
      await pending.server.dispose();
    }
  });

  it('preserves a prior committed success when a later serial transfer exhausts aggregate bytes', async () => {
    const server = Testing.Http.server((request) => {
      const path = new URL(request.url).pathname;
      return Testing.Http.text(request, path.endsWith('/first.txt') ? 'one' : 'four');
    });
    try {
      const firstSource = localhost(server.url.join('first.txt'));
      const secondSource = localhost(server.url.join('second.txt'));
      const resources = [
        resource(firstSource, 'first.txt', 'one', undefined),
        resource(secondSource, 'second.txt', 'four', undefined),
      ];
      const owner = await rooted();
      const policy = resourcePolicy(resources, { concurrency: 1, maxTotalBytes: 6 });

      const result = await start(resources, owner, policy).done;

      expect(result.ok).to.eql(false);
      expect(result.terminal?.kind).to.eql('aggregate-limit');
      expect(result.ops[0].ok).to.eql(true);
      expect(asFailure(result.ops[1]).kind).to.eql('aggregate-limit');
      expect(result.totals.transferredBytes).to.eql(7);
      expect(result.totals.publishedBytes).to.eql(3);
      expect(await Fs.readText(Fs.join(owner.path, 'first.txt'))).to.include({
        ok: true,
        data: 'one',
      });
      expect(await Fs.exists(Fs.join(owner.path, 'second.txt'))).to.eql(false);
    } finally {
      await server.dispose();
    }
  });

  it('records one aggregate first cause across concurrent workers and prevents late publication', async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => release = resolve);
    const server = Testing.Http.server(async (request) => {
      const path = new URL(request.url).pathname;
      if (path.endsWith('/slow.txt')) await gate;
      return Testing.Http.text(request, path.endsWith('/large.txt') ? '12345678' : 'slow');
    });
    try {
      const largeSource = localhost(server.url.join('large.txt'));
      const slowSource = localhost(server.url.join('slow.txt'));
      const resources = [
        resource(largeSource, 'large.txt', '12345678', undefined),
        resource(slowSource, 'slow.txt', 'slow', undefined),
      ];
      const owner = await rooted();
      const operation = start(
        resources,
        owner,
        resourcePolicy(resources, { concurrency: 2, maxTotalBytes: 4 }),
      );

      const result = await operation.done;
      expect(result.ok).to.eql(false);
      expect(result.terminal?.kind).to.eql('aggregate-limit');
      expect(result.ops.every((record) => !record.ok && record.kind === 'aggregate-limit')).to.eql(
        true,
      );
      expect(await Fs.exists(Fs.join(owner.path, 'large.txt'))).to.eql(false);
      expect(await Fs.exists(Fs.join(owner.path, 'slow.txt'))).to.eql(false);

      release();
      await Time.wait(20);
      expect(await Fs.exists(Fs.join(owner.path, 'slow.txt'))).to.eql(false);
    } finally {
      release();
      await server.dispose();
    }
  });

  it('retains a trusted committed filesystem failure across a cancellation race', async () => {
    let enteredResolve!: () => void;
    let releaseResolve!: () => void;
    const entered = new Promise<void>((resolve) => enteredResolve = resolve);
    const released = new Promise<void>((resolve) => releaseResolve = resolve);
    const server = Testing.Http.server((request) => Testing.Http.text(request, 'content'));
    try {
      const source = localhost(server.url.join('committed.txt'));
      const resources = [resource(source, 'committed.txt', 'content')];
      const owner = await rooted();
      const destination: t.Fs.Rooted.Instance = Object.freeze({
        ...owner,
        publishFile: async () => {
          enteredResolve();
          await released;
          throw rootedFailure('publish-file', 'io-failure', 'COMMITTED-SECRET', true);
        },
      });
      const operation = start(resources, destination);

      await entered;
      operation.cancel('cancel-after-commit');
      releaseResolve();
      const result = await operation.done;

      expect(result.ok).to.eql(false);
      expect(result.terminal?.kind).to.eql('cancelled');
      expect(asFailure(result.ops[0]).kind).to.eql('publication-failure');
      expect(asFailure(result.ops[0]).filesystem).to.eql({
        operation: 'publish-file',
        kind: 'io-failure',
        committed: true,
      });
      expect(JSON.stringify(result).includes('SECRET')).to.eql(false);
    } finally {
      releaseResolve();
      await server.dispose();
    }
  });
});
