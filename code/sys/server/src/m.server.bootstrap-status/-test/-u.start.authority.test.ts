import { describe, expect, it, type t, WebFixture } from '../../-test.ts';
import { DEFAULT_DEPENDENCIES, startWith } from '../u/u.start.ts';
import { catchError, input } from './u.fixture.ts';

describe('BootstrapStatus.start/startup authority', () => {
  it('rejects invalid generated capabilities without coercion or listener startup', async () => {
    let starts = 0;
    const startHttp: typeof DEFAULT_DEPENDENCIES.startHttp = (...args) => {
      starts++;
      return DEFAULT_DEPENDENCIES.startHttp(...args);
    };

    for (const capability of ['caller-selected', 'a'.repeat(24), 'a'.repeat(26)]) {
      const invalid = await catchError(() =>
        startWith(input(), {
          ...DEFAULT_DEPENDENCIES,
          capability: () => capability,
          startHttp,
        })
      );
      expect({ capability, message: invalid?.message }).to.eql({
        capability,
        message: 'BootstrapStatus.start failed.',
      });
    }

    let coercions = 0;
    const hostile = {
      [Symbol.toPrimitive]() {
        coercions++;
        throw new Error('capability coercion invoked');
      },
    };
    const hostileFailure = await catchError(() =>
      startWith(input(), {
        ...DEFAULT_DEPENDENCIES,
        capability: () => hostile as unknown as string,
        startHttp,
      })
    );
    expect(hostileFailure?.message).to.eql('BootstrapStatus.start failed.');
    expect({ starts, coercions }).to.eql({ starts: 0, coercions: 0 });
  });

  it('fails before listener startup when Promise transport changes across the first turn', async () => {
    let speciesReads = 0;
    let starts = 0;
    const pending = startWith(input(), {
      ...DEFAULT_DEPENDENCIES,
      startHttp(...args) {
        starts++;
        return DEFAULT_DEPENDENCIES.startHttp(...args);
      },
    });
    let failure: Error | undefined;
    {
      using _mock = WebFixture.Property.mock([{
        target: Promise,
        key: Symbol.species,
        descriptor: {
          configurable: true,
          get() {
            speciesReads++;
            throw new Error('Promise species accessor invoked');
          },
        },
      }]);
      failure = await catchError(() => pending);
    }
    expect(failure?.message).to.eql('BootstrapStatus.start failed.');
    expect({ starts, speciesReads }).to.eql({ starts: 0, speciesReads: 0 });
  });

  it('sanitizes a synchronous bind failure', async () => {
    let attempts = 0;
    const failure = await catchError(() =>
      startWith(input(), {
        ...DEFAULT_DEPENDENCIES,
        startHttp() {
          attempts++;
          throw new Error('raw-bind-failure');
        },
      })
    );
    expect({ attempts, message: failure?.message }).to.eql({
      attempts: 1,
      message: 'BootstrapStatus.start failed.',
    });
  });

  it('rolls back a listener that terminates during startup settlement', async () => {
    let listener: t.HttpServer.Started | undefined;
    let actualFinished: Promise<void> | undefined;
    let closeCalls = 0;
    const failure = await catchError(() =>
      startWith(input(), {
        ...DEFAULT_DEPENDENCIES,
        startHttp(...args) {
          const started = DEFAULT_DEPENDENCIES.startHttp(...args);
          const close = started.close.bind(started);
          actualFinished = started.finished;
          Object.defineProperty(started, 'finished', {
            configurable: true,
            value: Promise.resolve(),
          });
          Object.defineProperty(started, 'close', {
            value: (reason?: unknown) => {
              closeCalls++;
              return close(reason);
            },
          });
          listener = started;
          void started.close('test.immediate-death');
          return started;
        },
      })
    );

    expect(failure?.message).to.eql('BootstrapStatus.start failed.');
    await listener?.finished;
    await actualFinished;
    expect(closeCalls).to.eql(2);
  });
});
