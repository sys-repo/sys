import { describe, expect, it, Rx } from '../../-test.ts';
import { snapshotInput } from '../u/u.input.ts';
import { DEFAULT_DEPENDENCIES, type StartDependencies, startWith } from '../u/u.start.ts';
import { catchError, input, PAGE } from './u.fixture.ts';

describe('BootstrapStatus.start/input authority', () => {
  it('rejects malformed top-level authority before listener startup', async () => {
    let starts = 0;
    const deps: StartDependencies = {
      ...DEFAULT_DEPENDENCIES,
      capability: () => 'c'.repeat(48),
      startHttp(...args) {
        starts++;
        return DEFAULT_DEPENDENCIES.startHttp(...args);
      },
    };
    let proxyTraps = 0;
    const proxiedInput = new Proxy(input(), {
      getPrototypeOf(target) {
        proxyTraps++;
        return Reflect.getPrototypeOf(target);
      },
      ownKeys(target) {
        proxyTraps++;
        return Reflect.ownKeys(target);
      },
    });

    for (
      const value of [
        proxiedInput,
        null,
        {},
        { pages: [], resolve: () => ({ kind: 'page', key: 'ready' }) },
        {
          pages: [{ key: 'same', bytes: PAGE }, { key: 'same', bytes: PAGE }],
          resolve: () => ({ kind: 'page', key: 'same' }),
        },
        { ...input(), token: 'caller-selected' },
        { ...input(), capability: 'caller-selected' },
      ]
    ) {
      const error = await catchError(() => startWith(value, deps));
      expect(error?.message).to.eql('BootstrapStatus.start invalid input.');
    }
    expect({ starts, proxyTraps }).to.eql({ starts: 0, proxyTraps: 0 });

    let tagAccessorCalls = 0;
    const taggedPage = { key: 'ready', bytes: PAGE };
    Object.defineProperty(taggedPage, Symbol.toStringTag, {
      get() {
        tagAccessorCalls++;
        return 'Object';
      },
    });
    expect(
      snapshotInput({
        pages: [taggedPage],
        resolve: () => ({ kind: 'page', key: 'ready' }),
      })?.pages.size,
    ).to.eql(1);
    expect(tagAccessorCalls).to.eql(0);
  });

  it('rejects legacy lifecycle authority without observing it', async () => {
    let proxyTraps = 0;
    const hostileSignal = new Proxy(new AbortController().signal, {
      get() {
        proxyTraps++;
        throw new Error('until proxy get trap');
      },
      getPrototypeOf() {
        proxyTraps++;
        throw new Error('until proxy prototype trap');
      },
      ownKeys() {
        proxyTraps++;
        throw new Error('until proxy keys trap');
      },
    });
    const observingHandler: ProxyHandler<object> = {
      get(target, key, receiver) {
        proxyTraps++;
        return Reflect.get(target, key, receiver);
      },
      getPrototypeOf(target) {
        proxyTraps++;
        return Reflect.getPrototypeOf(target);
      },
      ownKeys(target) {
        proxyTraps++;
        return Reflect.ownKeys(target);
      },
    };
    const revoked = Proxy.revocable({}, observingHandler);
    revoked.revoke();

    let accessorCalls = 0;
    const signalAccessor = Object.create(AbortSignal.prototype);
    Object.defineProperty(signalAccessor, 'aborted', {
      enumerable: true,
      get() {
        accessorCalls++;
        return false;
      },
    });
    const duck = {};
    Object.defineProperties(duck, {
      disposed: {
        enumerable: true,
        get() {
          accessorCalls++;
          return false;
        },
      },
      dispose$: {
        enumerable: true,
        get() {
          accessorCalls++;
          return undefined;
        },
      },
    });
    const topAccessor = input() as Record<PropertyKey, unknown>;
    Object.defineProperty(topAccessor, 'until', {
      enumerable: true,
      get() {
        accessorCalls++;
        return new AbortController().signal;
      },
    });

    let subscriptions = 0;
    let callbacks = 0;
    const observable = new Rx.Observable<void>((subscriber) => {
      subscriptions++;
      subscriber.next();
      callbacks++;
    });
    const subject = new Rx.Subject<void>();
    const subscribe = subject.subscribe.bind(subject);
    Object.defineProperty(subject, 'subscribe', {
      value: (...args: unknown[]) => {
        subscriptions++;
        const subscription = Reflect.apply(subscribe, subject, args);
        subject.next();
        callbacks++;
        return subscription;
      },
    });

    const observedSignal = new AbortController().signal;
    const observer = () => undefined;
    observedSignal.addEventListener('abort', observer);
    observedSignal.removeEventListener('abort', observer);
    const nativeSignal = new AbortController().signal;
    const forgedSignal = Object.create(
      AbortSignal.prototype,
      Object.getOwnPropertyDescriptors(nativeSignal),
    );
    const values = [
      hostileSignal,
      new Proxy({}, observingHandler),
      new Proxy(Object.freeze({ kind: 'until' }), observingHandler),
      revoked.proxy,
      signalAccessor,
      duck,
      undefined,
      [],
      observable,
      subject,
      nativeSignal,
      observedSignal,
      forgedSignal,
    ];

    for (const until of values) {
      const error = await catchError(() => startWith({ ...input(), until }));
      expect(error?.message).to.eql('BootstrapStatus.start invalid input.');
    }
    const topAccessorError = await catchError(() => startWith(topAccessor));
    expect(topAccessorError?.message).to.eql('BootstrapStatus.start invalid input.');
    expect({ proxyTraps, accessorCalls, subscriptions, callbacks }).to.eql({
      proxyTraps: 0,
      accessorCalls: 0,
      subscriptions: 0,
      callbacks: 0,
    });
  });
});
