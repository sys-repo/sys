import { describe, expect, it, type t } from '../../-test.ts';
import { Schedule } from '../mod.ts';
import { runWorkerFixture } from './u.fixture.worker.ts';

type Scenario = keyof FixtureResults;
type FixtureResults = {
  readonly ambientReplacement: {
    readonly ambientPromiseCalls: number;
    readonly ambientQueueCalls: number;
    readonly ambientTimerCalls: number;
    readonly callbackCalls: number;
    readonly callbacksReturnedUndefined: boolean;
    readonly constructorReads: number;
    readonly descriptorsRestored: boolean;
    readonly macroHasOwnConstructor: boolean;
    readonly macroUsesCapturedPrototype: boolean;
    readonly microHasOwnConstructor: boolean;
    readonly microUsesCapturedPrototype: boolean;
    readonly speciesReads: number;
  };
  readonly fallbackAuthority: {
    readonly ambientPromiseCalls: number;
    readonly ambientQueueCalls: number;
    readonly callbackCalls: number;
    readonly callbackReturnedUndefined: boolean;
    readonly constructorReads: number;
    readonly descriptorsRestored: boolean;
    readonly hopHasOwnConstructor: boolean;
    readonly hopUsesCapturedPrototype: boolean;
    readonly speciesReads: number;
  };
  readonly capturedBinding: {
    readonly descriptorRestored: boolean;
    readonly macroUsesCapturedPrototype: boolean;
    readonly macroUsesOriginalPrototype: boolean;
    readonly microUsesCapturedPrototype: boolean;
    readonly microUsesOriginalPrototype: boolean;
    readonly rafUsesCapturedPrototype: boolean;
    readonly rafUsesOriginalPrototype: boolean;
  };
  readonly capturedRaf: {
    readonly ambientRafCalls: number;
    readonly ambientTimerCalls: number;
    readonly callbackCalls: number;
    readonly callbackReturnedUndefined: boolean;
    readonly capturedRafCalls: number;
    readonly descriptorsRestored: boolean;
    readonly hopHasOwnConstructor: boolean;
    readonly hopUsesCapturedPrototype: boolean;
  };
  readonly capturedRafFallback: {
    readonly ambientRafCalls: number;
    readonly ambientTimerCalls: number;
    readonly callbackCalls: number;
    readonly callbackReturnedUndefined: boolean;
    readonly descriptorsRestored: boolean;
    readonly hopHasOwnConstructor: boolean;
    readonly hopUsesCapturedPrototype: boolean;
  };
  readonly hostCallbackErrors: {
    readonly listenerActiveAfterCleanup: boolean;
    readonly macroFailurePreserved: boolean;
    readonly macroReturnedUndefined: boolean;
    readonly microFailurePreserved: boolean;
    readonly microReturnedUndefined: boolean;
    readonly timerActiveAfterCleanup: boolean;
  };
  readonly fallbackCallbackError: {
    readonly failurePreserved: boolean;
    readonly listenerActiveAfterCleanup: boolean;
    readonly returnedUndefined: boolean;
    readonly timerActiveAfterCleanup: boolean;
  };
  readonly eventTimeoutCleanup: {
    readonly listenerActiveAfterCleanup: boolean;
    readonly timedOut: boolean;
    readonly timerActiveAfterCleanup: boolean;
  };
};

describe('Schedule turn authority', () => {
  it('scheduler construction → preserves established callable shape', async () => {
    const staticIdentities = [Schedule.micro, Schedule.macro, Schedule.raf] as const;
    const schedulers: readonly t.ScheduleFn[] = [
      ...staticIdentities,
      Schedule.make(undefined, 'micro'),
      Schedule.make(undefined, 'macro'),
      Schedule.make(undefined, 'raf'),
    ];

    expect(Object.isFrozen(Schedule)).to.eql(true);

    schedulers.forEach((scheduler) => {
      expect(Object.getOwnPropertyDescriptor(scheduler, 'prototype')).to.equal(undefined);
      expect(scheduler.name).to.equal('fn');
      expect(scheduler.length).to.equal(1);
      expect(() => Reflect.construct(scheduler, [])).to.throw(TypeError);
    });

    await Schedule.micro();
    await Schedule.macro();
    await Schedule.raf();
    expect([Schedule.micro, Schedule.macro, Schedule.raf]).to.eql(staticIdentities);
  });

  it('ambient replacement → micro and macro retain captured construction and host authority', async () => {
    const actual = await runFixture('ambientReplacement');
    expect(actual).to.eql({
      ambientPromiseCalls: 0,
      ambientQueueCalls: 0,
      ambientTimerCalls: 0,
      callbackCalls: 2,
      callbacksReturnedUndefined: true,
      constructorReads: 0,
      descriptorsRestored: true,
      macroHasOwnConstructor: false,
      macroUsesCapturedPrototype: true,
      microHasOwnConstructor: false,
      microUsesCapturedPrototype: true,
      speciesReads: 0,
    });
  });

  it('cold fallback → both forms ignore later queue, constructor, and species mutation', async () => {
    const actual = await runFixture('fallbackAuthority');
    expect(actual).to.eql({
      ambientPromiseCalls: 0,
      ambientQueueCalls: 0,
      callbackCalls: 1,
      callbackReturnedUndefined: true,
      constructorReads: 0,
      descriptorsRestored: true,
      hopHasOwnConstructor: false,
      hopUsesCapturedPrototype: true,
      speciesReads: 0,
    });
  });

  it('cold Promise replacement → defines result construction for every mode', async () => {
    const actual = await runFixture('capturedBinding');
    expect(actual).to.eql({
      descriptorRestored: true,
      macroUsesCapturedPrototype: true,
      macroUsesOriginalPrototype: false,
      microUsesCapturedPrototype: true,
      microUsesOriginalPrototype: false,
      rafUsesCapturedPrototype: true,
      rafUsesOriginalPrototype: false,
    });
  });

  it('cold RAF binding → ignores later RAF and timer replacement', async () => {
    const actual = await runFixture('capturedRaf');
    expect(actual).to.eql({
      ambientRafCalls: 0,
      ambientTimerCalls: 0,
      callbackCalls: 1,
      callbackReturnedUndefined: true,
      capturedRafCalls: 2,
      descriptorsRestored: true,
      hopHasOwnConstructor: false,
      hopUsesCapturedPrototype: true,
    });
  });

  it('cold RAF fallback → ignores later RAF and timer replacement', async () => {
    const actual = await runFixture('capturedRafFallback');
    expect(actual).to.eql({
      ambientRafCalls: 0,
      ambientTimerCalls: 0,
      callbackCalls: 1,
      callbackReturnedUndefined: true,
      descriptorsRestored: true,
      hopHasOwnConstructor: false,
      hopUsesCapturedPrototype: true,
    });
  });

  it('public host callbacks → preserve thrown error identity and clean up observation', async () => {
    const actual = await runFixture('hostCallbackErrors');
    expect(actual).to.eql({
      listenerActiveAfterCleanup: false,
      macroFailurePreserved: true,
      macroReturnedUndefined: true,
      microFailurePreserved: true,
      microReturnedUndefined: true,
      timerActiveAfterCleanup: false,
    });
  });

  it('public fallback callback → preserves rejection identity and cleans up observation', async () => {
    const actual = await runFixture('fallbackCallbackError');
    expect(actual).to.eql({
      failurePreserved: true,
      listenerActiveAfterCleanup: false,
      returnedUndefined: true,
      timerActiveAfterCleanup: false,
    });
  });

  it('event timeout → removes its listener and timer before replying', async () => {
    const actual = await runFixture('eventTimeoutCleanup');
    expect(actual).to.eql({
      listenerActiveAfterCleanup: false,
      timedOut: true,
      timerActiveAfterCleanup: false,
    });
  });
});

function runFixture<S extends Scenario>(scenario: S): Promise<FixtureResults[S]> {
  return runWorkerFixture(
    new URL('./u.fixture.host-capture.worker.ts', import.meta.url),
    `Schedule authority worker (${scenario})`,
    scenario,
  );
}
