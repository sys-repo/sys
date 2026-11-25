import { describe, expect, it, type t } from './common.ts';
import { createShutdownSignal } from '../u.lifecycle/u.shutdown.ts';

const unsupported: t.Process.Signal.Lib['on'] = () => ({ kind: 'unsupported' });

describe('@sys/cell/cli shutdown signal', () => {
  it('keyboard interrupt → publishes the same reason to the lifecycle and abort signal', async () => {
    const shutdown = createShutdownSignal({ on: unsupported });

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
    }
  });

  it('quit wins normally and does not count toward interrupt escalation', async () => {
    const shutdown = createShutdownSignal({
      on: unsupported,
      exit() {
        throw new Error('unexpected escalation');
      },
    });
    try {
      expect(shutdown.quit()).to.eql(true);
      expect(shutdown.quit()).to.eql(false);
      expect(shutdown.interrupt()).to.eql(false);
      expect(await shutdown.done).to.eql('keyboard:quit');
      expect(shutdown.signal.reason).to.eql('keyboard:quit');
    } finally {
      shutdown.dispose();
    }
  });

  it('retains the first presentation failure over a later interrupt', async () => {
    const shutdown = createShutdownSignal({ on: unsupported });
    const cause = new Error('presentation-failed');

    try {
      expect(shutdown.failPresentation(cause)).to.eql(true);
      expect(shutdown.quit()).to.eql(false);
      expect(shutdown.interrupt()).to.eql(false);

      const reason = await shutdown.done;
      expect(reason).to.have.property('kind', 'presentation');
      expect(reason).to.have.property('cause', cause);
      expect(shutdown.signal.reason).to.equal(reason);
    } finally {
      shutdown.dispose();
    }
  });

  it('seals a completed service outcome against later terminal requests', async () => {
    const shutdown = createShutdownSignal({ on: unsupported });
    let claimed = false;
    let requested = false;
    void shutdown.claimed.then(() => (claimed = true));
    void shutdown.done.then(() => (requested = true));

    try {
      expect(shutdown.seal()).to.eql(true);
      expect(shutdown.settled).to.eql(true);
      expect(shutdown.seal()).to.eql(false);
      expect(shutdown.failPresentation(new Error('late'))).to.eql(false);
      await Promise.resolve();

      expect(claimed).to.eql(true);
      expect(requested).to.eql(false);
      expect(shutdown.reason).to.eql(undefined);
      expect(shutdown.signal.aborted).to.eql(false);
    } finally {
      shutdown.dispose();
    }
  });

  for (const failure of ['unsupported', 'throw'] as const) {
    it(`SIGINT ${failure} → still handles SIGTERM and counts a keyboard interrupt as the second`, async () => {
      const exit = new Error('exit-130');
      const exitCodes: number[] = [];
      const attached: t.Process.Signal.Name[] = [];
      let sigterm: (() => void) | undefined;
      let releases = 0;
      const shutdown = createShutdownSignal({
        on(signal, handler) {
          attached.push(signal);
          if (signal === 'SIGINT') {
            if (failure === 'throw') throw new Error('SIGINT registration failed');
            return { kind: 'unsupported' };
          }
          sigterm = handler;
          return { kind: 'attached', dispose: () => releases++ };
        },
        exit(code): never {
          exitCodes.push(code);
          throw exit;
        },
      });

      try {
        expect(attached).to.eql(['SIGINT', 'SIGTERM']);
        if (!sigterm) throw new Error('Expected a SIGTERM handler.');
        sigterm();
        expect(exitCodes).to.eql([]);
        expect(await shutdown.done).to.eql('signal:SIGTERM');
        expect(() => shutdown.interrupt()).to.throw(exit);
        expect(exitCodes).to.eql([130]);
        expect(shutdown.reason).to.eql('signal:SIGTERM');
        expect(shutdown.signal.reason).to.eql('signal:SIGTERM');
      } finally {
        shutdown.dispose();
      }
      expect(releases).to.eql(1);
    });
  }

  it('aggregates distinct signal-release failures and retries only retained bindings', () => {
    const sigintFailure = new Error('sigint-release-failed');
    const sigtermFailure = new Error('sigterm-release-failed');
    const attempts: t.Process.Signal.Name[] = [];
    const shutdown = createShutdownSignal({
      on(signal) {
        let count = 0;
        return {
          kind: 'attached',
          dispose() {
            attempts.push(signal);
            count++;
            if (signal === 'SIGINT' && count === 1) throw sigintFailure;
            if (signal === 'SIGTERM' && count <= 2) throw sigtermFailure;
          },
        };
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

    expect(() => shutdown.dispose()).to.throw(sigtermFailure);
    shutdown.dispose();
    shutdown.dispose();
    expect(attempts).to.eql(['SIGINT', 'SIGTERM', 'SIGINT', 'SIGTERM', 'SIGTERM']);
  });

  it('escalates only the second interrupt even after another terminal winner', () => {
    const exit = new Error('exit-130');
    const exitCodes: number[] = [];
    const shutdown = createShutdownSignal({
      on: unsupported,
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
