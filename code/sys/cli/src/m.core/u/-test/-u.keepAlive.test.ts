import { describe, expect, expectError, it, Rx } from '../../../-test.ts';
import { createKeepAlive } from '../u.keepAlive.ts';

describe('Cli.keepAlive', () => {
  for (const mode of ['unsupported', 'throw'] as const) {
    it(`SIGINT ${mode} → rejects before startup without exiting`, async () => {
      const failure = new Error('registration failed');
      const keepAlive = createKeepAlive({
        on(name) {
          expect(name).to.eql('SIGINT');
          if (mode === 'throw') throw failure;
          return { kind: 'unsupported' };
        },
        exit() {
          throw new Error('Unexpected exit.');
        },
      });
      const error = await expectError(() =>
        keepAlive({
          onStart() {
            throw new Error('Unexpected startup.');
          },
        })
      );
      if (mode === 'throw') expect(error).to.equal(failure);
      else expect(error.message).to.eql('Cli.keepAlive requires SIGINT.');
    });
  }

  for (const timing of ['during startup', 'while waiting'] as const) {
    it(`SIGINT ${timing} → disposes the lifecycle, releases the binding, then exits`, async () => {
      const life = Rx.lifecycle();
      const exit = new Error('exit');
      const order: string[] = [];
      let signal: (() => void) | undefined;
      const deliver = () => {
        if (!signal) throw new Error('Expected SIGINT handler before startup.');
        signal();
        expect(life.disposed).to.eql(true);
      };
      const keepAlive = createKeepAlive({
        on(name, handler) {
          expect(name).to.eql('SIGINT');
          signal = handler;
          return { kind: 'attached', dispose: () => order.push('release') };
        },
        exit(code) {
          order.push(`exit:${code}`);
          throw exit;
        },
      });
      const error = expectError(() =>
        keepAlive({
          life,
          exitCode: 7,
          onStart(started) {
            expect(started).to.equal(life);
            if (timing === 'during startup') deliver();
          },
        })
      );
      if (timing === 'while waiting') {
        await Promise.resolve();
        expect(order).to.eql([]);
        expect(life.disposed).to.eql(false);
        deliver();
      }
      expect(await error).to.equal(exit);
      expect(order).to.eql(['release', 'exit:7']);
    });
  }

  it('startup failure → releases the binding and lifecycle without exiting', async () => {
    const life = Rx.lifecycle();
    const failure = new Error('startup failed');
    let released = 0;
    const keepAlive = createKeepAlive({
      on: () => ({ kind: 'attached', dispose: () => released++ }),
      exit() {
        throw new Error('Unexpected exit.');
      },
    });
    const error = await expectError(() =>
      keepAlive({
        life,
        onStart() {
          throw failure;
        },
      })
    );
    expect(error).to.equal(failure);
    expect(life.disposed).to.eql(true);
    expect(released).to.eql(1);
  });

  it('startup and signal release fail → disposes the lifecycle and preserves both failures', async () => {
    const life = Rx.lifecycle();
    const startup = new Error('startup failed');
    const release = new Error('signal release failed');
    let cleaned = 0;
    let exits = 0;
    const keepAlive = createKeepAlive({
      on: () => ({
        kind: 'attached',
        dispose() {
          throw release;
        },
      }),
      exit() {
        exits++;
        throw new Error('Unexpected exit.');
      },
    });
    const error = await expectError(() =>
      keepAlive({
        life,
        onStart(started) {
          started.dispose$.subscribe({ complete: () => cleaned++ });
          throw startup;
        },
      })
    );
    expect(cleaned).to.eql(1);
    expect(life.disposed).to.eql(true);
    expect(exits).to.eql(0);
    expect(error).to.be.instanceOf(AggregateError);
    expect(error.cause).to.equal(startup);
    expect(error.errors).to.have.length(2);
    expect(error.errors[0]).to.equal(startup);
    expect(error.errors[1]).to.equal(release);
  });
});
