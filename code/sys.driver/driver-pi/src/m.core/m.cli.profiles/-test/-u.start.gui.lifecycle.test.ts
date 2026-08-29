import { describe, expect, it, WebFixture } from '../../../-test.ts';
import { Rx, type t } from '../common.ts';
import { createOwnedError } from '../u.start/u.error.ts';
import { failedBootState } from '../u.start/u.failure.ts';
import { snapshotApplicationOwner } from '../u.start/u.identity.ts';
import { createSupervisor, finalError, snapshotStatusOwner } from '../u.start/u.lifecycle.ts';
import { isPromiseTransportReady, observePromiseTransport } from '../u.start/u.promise.ts';
import { Boot, createBootState } from '../u.start/u.state.ts';
import { START_GUI_SERVICE } from '../u/u.start.gui.service.ts';
import {
  bootstrapStatusFixture,
  deferred,
  DIST_DIGEST,
  startedFixture,
} from './u.fixture.start.gui.ts';

const STATUS_URL = 'http://127.0.0.1:45000/0123456789abcdefghijklmnopqrstuvwxyzabcd' as t.StringUrl;
const APPLICATION_EXPECTATION = Object.freeze({
  integrity: START_GUI_SERVICE.source.integrity,
  expectedPkg: START_GUI_SERVICE.source.expectedPkg,
});

describe('@sys/driver-pi start:gui terminal arbiter', () => {
  it('requires one concrete canonical IPv4 status listener port', () => {
    const suffix = '/0123456789abcdefghijklmnopqrstuvwxyzabcd';
    const cases: readonly Readonly<{ url: t.StringUrl; admitted: boolean }>[] = [
      { url: `http://127.0.0.1:45000${suffix}` as t.StringUrl, admitted: true },
      { url: `http://127.0.0.1:0${suffix}` as t.StringUrl, admitted: false },
      { url: `http://127.0.0.1${suffix}` as t.StringUrl, admitted: false },
      { url: `http://[::1]:45000${suffix}` as t.StringUrl, admitted: false },
    ];

    for (const test of cases) {
      const snapshot = snapshotStatusOwner(bootstrapStatusFixture({ url: test.url }));
      expect({ url: test.url, kind: snapshot.kind }).to.eql({
        url: test.url,
        kind: test.admitted ? 'admitted' : 'invalid',
      });
    }
  });

  it('copies only close, origin, and verified digest from an admitted application owner', async () => {
    const base = startedFixture();
    let receiver: unknown = 'not-called';
    let reason: unknown;
    const started = {
      ...base,
      sensitiveControl: Object.freeze({ token: 'must-not-be-retained' }),
      close(this: unknown, value?: unknown) {
        receiver = this;
        reason = value;
        return Promise.resolve();
      },
    };

    const snapshot = snapshotApplicationOwner(started, APPLICATION_EXPECTATION);
    expect(snapshot.kind).to.eql('admitted');
    if (snapshot.kind !== 'admitted') throw new Error('Expected admitted application owner.');
    expect(Reflect.ownKeys(snapshot.owner)).to.eql(['close', 'origin', 'digest']);
    expect(snapshot.owner.digest).to.eql(DIST_DIGEST);
    expect(Reflect.ownKeys(snapshot)).to.eql(['kind', 'owner', 'finished']);
    await snapshot.owner.close('narrow-close');
    expect({ receiver, reason }).to.eql({ receiver: undefined, reason: 'narrow-close' });
  });

  it('latches trusted stop immediately and rejects later synchronous work and failure', async () => {
    const fixture = supervisorFixture();
    let workStarted = false;

    fixture.supervisor.requestStop('trusted quit');
    const admission = fixture.supervisor.admitWork(() => {
      workStarted = true;
    });
    fixture.supervisor.publishFailure(
      createOwnedError('later synchronous failure'),
      failedBootState(undefined, 'screen'),
    );

    expect(admission).to.eql({
      kind: 'blocked',
      event: { kind: 'stop', source: 'trusted-control' },
    });
    expect(workStarted).to.eql(false);
    expect(await fixture.supervisor.checkpoint()).to.eql({
      kind: 'stop',
      source: 'trusted-control',
    });
    expect(await fixture.supervisor.terminal).to.eql({
      kind: 'stop',
      source: 'trusted-control',
    });
    expect(fixture.supervisor.signal.reason).to.eql('start:gui.trusted-control');
    expect(fixture.stopLife.signal.reason).to.eql('start:gui.trusted-control');
    await fixture.supervisor.close();
  });

  it('lets an earlier queued rejection beat a later same-turn stop candidate', async () => {
    const fixture = supervisorFixture();
    const failure = createOwnedError('queued failure');
    const state = failedBootState(undefined, 'screen');
    const publishing = Promise.resolve().then(() => {
      const reaction = fixture.supervisor.beginObservedReaction();
      fixture.supervisor.publishObservedFailure(reaction, failure, state);
    });

    fixture.supervisor.requestStop('later trusted quit');
    expect(fixture.supervisor.currentBlocker).to.eql({
      kind: 'stop',
      source: 'trusted-control',
    });
    await publishing;

    const terminal = await fixture.supervisor.terminal;
    expect(terminal.kind).to.eql('failure');
    if (terminal.kind === 'failure') expect(terminal.error).to.equal(failure);
    await fixture.supervisor.close();
  });

  it('lets an earlier queued failure beat a later synchronous failure candidate', async () => {
    const fixture = supervisorFixture();
    const earlier = createOwnedError('earlier queued failure');
    const later = createOwnedError('later synchronous failure');
    const state = failedBootState(undefined, 'screen');
    const publishing = Promise.resolve().then(() => {
      const reaction = fixture.supervisor.beginObservedReaction();
      fixture.supervisor.publishObservedFailure(reaction, earlier, state);
    });

    fixture.supervisor.publishFailure(later, state);
    expect(fixture.supervisor.currentBlocker).to.include({ kind: 'failure', error: later });
    await publishing;

    const terminal = await fixture.supervisor.terminal;
    expect(terminal.kind).to.eql('failure');
    if (terminal.kind === 'failure') expect(terminal.error).to.equal(earlier);
    fixture.supervisor.requestStop('cleanup');
    await fixture.supervisor.close();
  });

  it('observes an exact native promise without dispatching through its own then', async () => {
    const rawFailure = new Error('transport rejection');
    const promise = Promise.reject(rawFailure);
    let ownThenCalls = 0;
    Object.defineProperty(promise, 'then', {
      configurable: true,
      value() {
        ownThenCalls += 1;
        throw new Error('own then invoked');
      },
    });

    const observation = observePromiseTransport<unknown, string>(promise, {
      fulfilled: () => 'fulfilled',
      rejected: (cause) => cause === rawFailure ? 'rejected' : 'wrong rejection',
    });

    expect(observation.kind).to.eql('observed');
    if (observation.kind === 'observed') {
      expect(await observation.promise).to.eql('rejected');
    }
    expect(ownThenCalls).to.eql(0);
  });

  it('rejects constructor-poisoned promise transport without invoking the accessor', () => {
    const pending = Promise.withResolvers<void>();
    let constructorReads = 0;
    Object.defineProperty(pending.promise, 'constructor', {
      configurable: true,
      get() {
        constructorReads += 1;
        throw new Error('constructor accessor invoked');
      },
    });

    expect(observePromiseTransport(pending.promise, {
      fulfilled() {},
      rejected() {},
    })).to.eql({ kind: 'invalid' });
    expect(constructorReads).to.eql(0);
    pending.resolve();
  });

  it('rejects later Promise prototype-constructor poisoning without invoking the accessor', () => {
    const promise = Promise.resolve();
    let constructorReads = 0;
    {
      using _mock = WebFixture.Property.mock([{
        target: Promise.prototype,
        key: 'constructor',
        descriptor: {
          configurable: true,
          get() {
            constructorReads += 1;
            throw new Error('inherited constructor accessor invoked');
          },
        },
      }]);

      expect(isPromiseTransportReady()).to.eql(false);
      expect(observePromiseTransport(promise, {
        fulfilled() {},
        rejected() {},
      })).to.eql({ kind: 'invalid' });
      expect(constructorReads).to.eql(0);
    }
    expect(isPromiseTransportReady()).to.eql(true);
  });

  it('rejects later Promise species poisoning without invoking the accessor', () => {
    const promise = Promise.resolve();
    let speciesReads = 0;
    {
      using _mock = WebFixture.Property.mock([{
        target: Promise,
        key: Symbol.species,
        descriptor: {
          configurable: true,
          get() {
            speciesReads += 1;
            throw new Error('Promise species accessor invoked');
          },
        },
      }]);

      expect(isPromiseTransportReady()).to.eql(false);
      expect(observePromiseTransport(promise, {
        fulfilled() {},
        rejected() {},
      })).to.eql({ kind: 'invalid' });
      expect(speciesReads).to.eql(0);
    }
    expect(isPromiseTransportReady()).to.eql(true);
  });

  it('uses captured Promise methods through delayed retained-owner cleanup', async () => {
    const fixture = supervisorFixture();
    const applicationDone = deferred();
    const applicationClose = Promise.resolve();
    const leaseRelease = Promise.resolve();
    let releaseCalls = 0;
    fixture.supervisor.setApplication(
      startedFixture({
        finished: applicationDone.promise,
        close: () => applicationClose,
      }),
      APPLICATION_EXPECTATION,
    );
    fixture.supervisor.setLease({
      mode: 'shared',
      targets: [],
      release() {
        releaseCalls += 1;
        return leaseRelease;
      },
      [Symbol.asyncDispose]() {
        return this.release();
      },
    } as t.FsRooted.Lease);

    let ambientMethodCalls = 0;
    {
      using _mock = WebFixture.Property.mock([
        {
          target: Promise.prototype,
          key: 'then',
          descriptor: {
            configurable: true,
            value() {
              ambientMethodCalls += 1;
              throw new Error('ambient Promise.prototype.then invoked');
            },
          },
        },
        {
          target: Promise,
          key: 'resolve',
          descriptor: {
            configurable: true,
            value() {
              ambientMethodCalls += 1;
              throw new Error('ambient Promise.resolve invoked');
            },
          },
        },
        {
          target: Promise,
          key: 'withResolvers',
          descriptor: {
            configurable: true,
            value() {
              ambientMethodCalls += 1;
              throw new Error('ambient Promise.withResolvers invoked');
            },
          },
        },
      ]);

      expect(await fixture.supervisor.close()).to.eql({
        kind: 'cleanup-failed',
        issues: [
          { resource: 'application-listener', state: 'unresolved' },
          { resource: 'generation-lease', state: 'unresolved' },
        ],
      });
      applicationDone.resolve();
      await fixture.supervisor.checkpoint();
      expect(releaseCalls).to.eql(1);
      expect(ambientMethodCalls).to.eql(0);
    }
  });

  it('uses captured reflection while composing immutable final error evidence', () => {
    const originalDefine = Object.defineProperty;
    const originalDefineMany = Object.defineProperties;
    const originalDescriptor = Object.getOwnPropertyDescriptor;
    const primary = Object.freeze(createOwnedError('immutable primary'));
    const cleanup = Object.freeze({
      kind: 'cleanup-failed' as const,
      issues: Object.freeze([
        Object.freeze({ resource: 'status-listener' as const, state: 'unresolved' as const }),
      ]),
    });
    let ambientCalls = 0;
    let result: Error | undefined;

    {
      using _mock = WebFixture.Property.mock([
        {
          target: Object,
          key: 'defineProperty',
          descriptor: {
            configurable: true,
            value: (...args: Parameters<typeof Object.defineProperty>) => {
              ambientCalls += 1;
              return Reflect.apply(originalDefine, Object, args);
            },
          },
        },
        {
          target: Object,
          key: 'defineProperties',
          descriptor: {
            configurable: true,
            value: (...args: Parameters<typeof Object.defineProperties>) => {
              ambientCalls += 1;
              return Reflect.apply(originalDefineMany, Object, args);
            },
          },
        },
        {
          target: Object,
          key: 'getOwnPropertyDescriptor',
          descriptor: {
            configurable: true,
            value: (...args: Parameters<typeof Object.getOwnPropertyDescriptor>) => {
              ambientCalls += 1;
              return Reflect.apply(originalDescriptor, Object, args);
            },
          },
        },
        {
          target: globalThis,
          key: 'AggregateError',
          descriptor: {
            configurable: true,
            value: function () {
              ambientCalls += 1;
              throw new Error('ambient AggregateError invoked');
            },
          },
        },
      ]);
      result = finalError({ primary, cleanup });
    }

    expect(ambientCalls).to.eql(0);
    expect(result).to.be.instanceOf(Error);
    expect(result).not.to.equal(primary);
    expect(result?.message).to.eql('immutable primary');
    expect((result as Error & { primary?: unknown }).primary).to.equal(primary);
    expect((result as Error & { cleanup?: unknown }).cleanup).to.equal(cleanup);
  });

  it('bypasses inherited setters while preserving every secondary error field', () => {
    const primary = Object.freeze(createOwnedError('immutable primary'));
    const cleanup = Object.freeze({
      kind: 'cleanup-failed' as const,
      issues: Object.freeze([
        Object.freeze({ resource: 'status-listener' as const, state: 'unresolved' as const }),
      ]),
    });
    const presentation = Object.freeze({
      kind: 'browser-open-failed' as const,
      url: 'http://127.0.0.1:45000/capability' as t.StringUrl,
    });
    const materialization = Object.freeze({
      kind: 'materialization' as const,
      stage: 'manifest-fetch' as const,
      reason: 'resource-failure' as const,
      cleanup: 'pending' as const,
    });
    const keys = ['cleanup', 'presentation', 'materialization'] as const;
    const originals = keys.map((key) => Object.getOwnPropertyDescriptor(Object.prototype, key));
    const leaked: unknown[] = [];
    let setterCalls = 0;
    let result: Error | undefined;

    try {
      for (const key of keys) {
        Object.defineProperty(Object.prototype, key, {
          configurable: true,
          set(value) {
            setterCalls += 1;
            leaked.push(value);
          },
        });
      }
      result = finalError({ primary, cleanup, presentation, materialization });
    } finally {
      for (let index = 0; index < keys.length; index += 1) {
        const descriptor = originals[index];
        if (descriptor) Object.defineProperty(Object.prototype, keys[index], descriptor);
        else Reflect.deleteProperty(Object.prototype, keys[index]);
      }
    }

    expect({ setterCalls, leaked }).to.eql({ setterCalls: 0, leaked: [] });
    expect(result).not.to.equal(primary);
    expect((result as Error & { primary?: unknown }).primary).to.equal(primary);
    expect((result as Error & { cleanup?: unknown }).cleanup).to.equal(cleanup);
    expect((result as Error & { presentation?: unknown }).presentation).to.equal(presentation);
    expect((result as Error & { materialization?: unknown }).materialization).to.equal(
      materialization,
    );
  });

  it('dispatches one state publication once to a self-resubscribing observer', () => {
    const state = createBootState();
    let calls = 0;
    let unsubscribe: () => void = () => undefined;
    const observer = () => {
      calls += 1;
      unsubscribe();
      unsubscribe = state.subscribe(observer);
    };
    unsubscribe = state.subscribe(observer);

    state.set(Boot.startingAppHost);

    expect(calls).to.eql(1);
    expect(state.current).to.equal(Boot.startingAppHost);
    unsubscribe();
  });

  it('dispatches state through captured Set authority after iterator mutation', () => {
    const descriptor = Object.getOwnPropertyDescriptor(Set.prototype, Symbol.iterator);
    if (!descriptor) throw new Error('Expected Set iterator descriptor.');
    const state = createBootState();
    const calls: string[] = [];
    state.subscribe((value) => calls.push(value.kind));
    let ambientCalls = 0;

    try {
      Object.defineProperty(Set.prototype, Symbol.iterator, {
        ...descriptor,
        value() {
          ambientCalls += 1;
          throw new Error('ambient Set iterator invoked');
        },
      });
      state.set(Boot.startingAppHost);
    } finally {
      Object.defineProperty(Set.prototype, Symbol.iterator, descriptor);
    }

    expect(ambientCalls).to.eql(0);
    expect(calls).to.eql(['starting-app-host']);
    expect(state.current).to.equal(Boot.startingAppHost);
  });

  it('delivers the active state snapshot despite cross-unsubscription', () => {
    const state = createBootState();
    const calls: string[] = [];
    let unsubscribeSecond: () => void = () => undefined;
    state.subscribe(() => {
      calls.push('first');
      unsubscribeSecond();
    });
    unsubscribeSecond = state.subscribe(() => calls.push('second'));

    state.set(Boot.startingAppHost);
    state.set(Boot.ready('http://127.0.0.1:1234' as t.StringUrl, DIST_DIGEST));

    expect(calls).to.eql(['first', 'second', 'first']);
  });

  it('serializes reentrant state transitions after the active snapshot', () => {
    const state = createBootState();
    const calls: string[] = [];
    state.subscribe((value) => {
      calls.push(`first:${value.kind}:${state.current.kind}`);
      if (value.kind === 'starting-app-host') {
        state.set(Boot.ready('http://127.0.0.1:1234' as t.StringUrl, DIST_DIGEST));
      }
    });
    state.subscribe((value) => calls.push(`second:${value.kind}:${state.current.kind}`));

    state.set(Boot.startingAppHost);

    expect(calls).to.eql([
      'first:starting-app-host:starting-app-host',
      'second:starting-app-host:starting-app-host',
      'first:ready:ready',
      'second:ready:ready',
    ]);
  });

  it('keeps a stop created inside one direct reaction ahead of its later failure', async () => {
    const fixture = supervisorFixture();
    const reaction = fixture.supervisor.beginObservedReaction();

    fixture.supervisor.requestStop('reaction-local trusted quit');
    const won = fixture.supervisor.publishObservedFailure(
      reaction,
      createOwnedError('later reaction-local failure'),
      failedBootState(undefined, 'application-listener'),
    );

    expect(won).to.eql(false);
    expect(await fixture.supervisor.terminal).to.eql({
      kind: 'stop',
      source: 'trusted-control',
    });
    expect(fixture.state.current.kind).to.eql('preparing');
    await fixture.supervisor.close();
  });

  it('lets a synchronous state observer failure beat a later trusted stop', async () => {
    const fixture = supervisorFixture();
    const rawFailure = new Error('observer failed before stop');
    fixture.state.subscribe(() => {
      throw rawFailure;
    });

    fixture.state.set(Boot.startingAppHost);
    fixture.supervisor.requestStop('later trusted quit');

    const terminal = await fixture.supervisor.terminal;
    expect(terminal.kind).to.eql('failure');
    if (terminal.kind === 'failure') {
      expect(terminal.error).not.to.equal(rawFailure);
      expect(terminal.error.message).to.eql('start:gui boot-state observer failed.');
    }
    expect(await fixture.supervisor.close()).to.eql(undefined);
  });

  it('keeps an earlier observer throw ahead of a later reentrant stop and throw', async () => {
    const fixture = supervisorFixture();
    fixture.state.subscribe(() => {
      throw new Error('earlier observer throw');
    });
    fixture.state.subscribe(() => {
      fixture.supervisor.requestStop('later reentrant stop');
      throw new Error('later observer throw');
    });

    fixture.state.set(Boot.startingAppHost);

    const terminal = await fixture.supervisor.terminal;
    expect(terminal.kind).to.eql('failure');
    if (terminal.kind === 'failure') {
      expect(terminal.error.message).to.eql('start:gui boot-state observer failed.');
    }
    expect(await fixture.supervisor.close()).to.eql(undefined);
  });

  it('keeps a reentrant stop ahead of a later observer throw', async () => {
    const fixture = supervisorFixture();
    fixture.state.subscribe(() => {
      fixture.supervisor.requestStop('earlier reentrant stop');
      throw new Error('observer throw after stop');
    });
    fixture.state.subscribe(() => {
      throw new Error('later observer throw');
    });

    fixture.state.set(Boot.startingAppHost);

    expect(await fixture.supervisor.terminal).to.eql({
      kind: 'stop',
      source: 'trusted-control',
    });
    expect(await fixture.supervisor.close()).to.eql({
      kind: 'cleanup-failed',
      issues: [{ resource: 'state-observer', state: 'failed' }],
    });
  });

  it('keeps fixture listener completion pending when lower close rejects', async () => {
    const closeFailure = new Error('fixture close failed');
    const listener = deferred();
    const started = startedFixture({
      close: () => Promise.reject(closeFailure),
      finished: listener.promise,
    });

    expect(
      await started.close('test').then(
        () => undefined,
        (error) => error,
      ),
    ).to.equal(closeFailure);
    let listenerSettled = false;
    void started.finished.then(() => (listenerSettled = true));
    await Promise.resolve();
    expect(listenerSettled).to.eql(false);

    listener.resolve();
    await started.finished;
  });

  it('preserves external cancellation as a distinct stop source', async () => {
    const external = new AbortController();
    const fixture = supervisorFixture(external.signal);
    const rawReason = new Error('caller-owned external reason');

    external.abort(rawReason);

    expect(fixture.supervisor.signal.aborted).to.eql(true);
    expect(fixture.supervisor.signal.reason).to.eql('start:gui.external-cancellation');
    expect(fixture.supervisor.signal.reason).not.to.equal(rawReason);
    expect(fixture.supervisor.currentBlocker).to.eql({
      kind: 'stop',
      source: 'external-cancellation',
    });
    expect(await fixture.supervisor.terminal).to.eql({
      kind: 'stop',
      source: 'external-cancellation',
    });
    await fixture.supervisor.close();
  });
});

function supervisorFixture(until?: t.UntilInput) {
  const status = bootstrapStatusFixture({ url: STATUS_URL });
  const stopLife = Rx.abortable(until);
  const state = createBootState();
  const supervisor = createSupervisor({
    state,
    status,
    stopLife,
    workLife: Rx.abortable(),
  });
  return { state, supervisor, stopLife } as const;
}
