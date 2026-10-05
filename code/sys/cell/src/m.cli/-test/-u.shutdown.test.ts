import { describe, expect, it } from '../../-test.ts';
import { createShutdownSignal } from '../u.lifecycle/u.shutdown.ts';

describe('@sys/cell/cli shutdown signal', () => {
  it('publishes one keyboard interrupt and disposes signal listeners idempotently', async () => {
    const shutdown = createShutdownSignal();

    try {
      expect(shutdown.signal.aborted).to.eql(false);
      expect(shutdown.reason).to.eql(undefined);

      expect(shutdown.interrupt()).to.eql(true);
      expect(await shutdown.done).to.eql('keyboard:interrupt');

      expect(shutdown.signal.aborted).to.eql(true);
      expect(shutdown.signal.reason).to.eql('keyboard:interrupt');
      expect(shutdown.reason).to.eql('keyboard:interrupt');
    } finally {
      shutdown.dispose();
      shutdown.dispose();
    }
  });

  it('retains the first presentation failure over a later interrupt', async () => {
    const shutdown = createShutdownSignal();
    const cause = new Error('presentation-failed');

    try {
      expect(shutdown.failPresentation(cause)).to.eql(true);
      expect(shutdown.interrupt()).to.eql(false);

      const reason = await shutdown.done;
      expect(typeof reason).to.eql('object');
      if (typeof reason === 'string') throw new Error('Expected presentation reason.');
      expect(reason.kind).to.eql('presentation');
      expect(reason.cause).to.equal(cause);
      expect(shutdown.signal.reason).to.equal(reason);
    } finally {
      shutdown.dispose();
    }
  });

  it('seals a completed service outcome against later terminal requests', async () => {
    const shutdown = createShutdownSignal();
    let settled = false;
    void shutdown.done.then(() => (settled = true));

    try {
      expect(shutdown.seal()).to.eql(true);
      expect(shutdown.seal()).to.eql(false);
      expect(shutdown.failPresentation(new Error('late'))).to.eql(false);
      await Promise.resolve();

      expect(settled).to.eql(false);
      expect(shutdown.reason).to.eql(undefined);
      expect(shutdown.signal.aborted).to.eql(false);
    } finally {
      shutdown.dispose();
    }
  });

  it('aggregates distinct signal-release failures and retries only retained bindings', () => {
    const sigintFailure = new Error('sigint-release-failed');
    const sigtermFailure = new Error('sigterm-release-failed');
    const attempts: Deno.Signal[] = [];
    const failed = new Set<Deno.Signal>();
    const shutdown = createShutdownSignal({
      addSignalListener() {},
      removeSignalListener(signal) {
        attempts.push(signal);
        if (failed.has(signal)) return;
        failed.add(signal);
        throw signal === 'SIGINT' ? sigintFailure : sigtermFailure;
      },
    });
    let thrown: unknown;

    try {
      shutdown.dispose();
    } catch (cause) {
      thrown = cause;
    }

    expect(thrown instanceof AggregateError).to.eql(true);
    const aggregate = thrown as AggregateError;
    expect(aggregate.cause).to.equal(sigintFailure);
    expect(aggregate.errors).to.eql([sigintFailure, sigtermFailure]);

    shutdown.dispose();
    shutdown.dispose();
    expect(attempts).to.eql(['SIGINT', 'SIGTERM', 'SIGINT', 'SIGTERM']);
  });

  it('escalates only the second interrupt even after another terminal winner', () => {
    const exit = new Error('exit-130');
    const exitCodes: number[] = [];
    const shutdown = createShutdownSignal({
      addSignalListener() {},
      removeSignalListener() {},
      exit(code): never {
        exitCodes.push(code);
        throw exit;
      },
    });

    try {
      expect(shutdown.seal()).to.eql(true);
      expect(shutdown.interrupt()).to.eql(false);
      expect(() => shutdown.interrupt()).to.throw('exit-130');
      expect(exitCodes).to.eql([130]);
    } finally {
      shutdown.dispose();
    }
  });
});
