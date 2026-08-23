import { describe, expect, it } from '../../../-test.ts';
import { Is } from '../common.ts';
import { type BindDependencies, bindWith } from '../u.bind.ts';

type KeypressOwner = ReturnType<BindDependencies['keypress']>;

describe('CLI: core / Keyboard.bind lifecycle', () => {
  it('keeps a throwing event-owner disposal retryable through the same handle', async () => {
    const fixture = keypressOwner({ disposeFailures: 1 });
    const handle = bindWith({ onQuit() {} }, {
      isTerminal: () => true,
      keypress: () => fixture.owner,
    });
    if (!handle) throw new Error('Expected keyboard handle.');

    let firstFailure: unknown;
    try {
      handle.dispose();
    } catch (cause) {
      firstFailure = cause;
    }
    expect(firstFailure).not.to.equal(fixture.failure);
    expect(errorMessage(firstFailure)).to.eql('Keyboard disposal failed.');
    expect(fixture.disposeCalls).to.eql(1);

    handle.dispose();
    await handle.finished;
    expect(fixture.disposeCalls).to.eql(2);
    handle.dispose();
    expect(fixture.disposeCalls).to.eql(2);
  });

  it('latches stop before a throwing disposal and suppresses pending key delivery', async () => {
    const firstRead = Promise.withResolvers<IteratorResult<unknown>>();
    const lowerFailure = new Error('lower disposal failed');
    let disposed = false;
    let disposeCalls = 0;
    let nextCalls = 0;
    let resultReads = 0;
    let keyCalls = 0;
    const firstResult: IteratorYieldResult<unknown> = {
      get done(): false {
        resultReads += 1;
        return false;
      },
      get value() {
        resultReads += 1;
        return { key: 'a', ctrlKey: false };
      },
    };
    const owner = {
      get disposed() {
        return disposed;
      },
      dispose() {
        disposeCalls += 1;
        if (disposeCalls <= 2) throw lowerFailure;
        disposed = true;
      },
      [Symbol.asyncIterator]() {
        return {
          next() {
            nextCalls += 1;
            return nextCalls === 1
              ? firstRead.promise
              : Promise.resolve({ done: true, value: undefined });
          },
        };
      },
    } as unknown as KeypressOwner;
    const handle = bindWith({
      onQuit() {},
      onKey() {
        keyCalls += 1;
      },
    }, {
      isTerminal: () => true,
      keypress: () => owner,
    });
    if (!handle) throw new Error('Expected keyboard handle.');
    const finished = handle.finished.then(
      () => undefined,
      (cause) => cause,
    );

    let firstFailure: unknown;
    try {
      handle.dispose();
    } catch (cause) {
      firstFailure = cause;
    }
    firstRead.resolve(firstResult);

    const finishedFailure = await finished;
    expect(firstFailure).not.to.equal(lowerFailure);
    expect(errorMessage(firstFailure)).to.eql('Keyboard disposal failed.');
    expect(finishedFailure).not.to.equal(lowerFailure);
    expect(errorMessage(finishedFailure)).to.eql('Keyboard disposal failed.');
    expect(keyCalls).to.eql(0);
    expect(nextCalls).to.eql(1);
    expect(resultReads).to.eql(0);
    expect(disposeCalls).to.eql(2);

    handle.dispose();
    expect(disposeCalls).to.eql(3);
  });

  it('owns listener-finally disposal rejection and still permits a later retry', async () => {
    const fixture = keypressOwner({ disposeFailures: 1, finishImmediately: true });
    const handle = bindWith({ onQuit() {} }, {
      isTerminal: () => true,
      keypress: () => fixture.owner,
    });
    if (!handle) throw new Error('Expected keyboard handle.');
    const outcome = handle.finished.then(
      () => undefined,
      (cause) => cause,
    );

    const failure = await outcome;
    expect(failure).not.to.equal(fixture.failure);
    expect(errorMessage(failure)).to.eql('Keyboard disposal failed.');
    expect(fixture.disposeCalls).to.eql(1);
    handle.dispose();
    expect(fixture.disposeCalls).to.eql(2);
  });

  it('rejects unavailable listener loss instead of resolving trusted completion', async () => {
    const unavailable = new Deno.errors.BadResource('closed keyboard');
    const fixture = keypressOwner({ disposeFailures: 0, iteratorFailure: unavailable });
    const handle = bindWith({ onQuit() {} }, {
      isTerminal: () => true,
      keypress: () => fixture.owner,
    });
    if (!handle) throw new Error('Expected keyboard handle.');

    const failure = await handle.finished.then(
      () => undefined,
      (cause) => cause,
    );
    expect(failure).not.to.equal(unavailable);
    expect(errorMessage(failure)).to.eql('Keyboard listener unavailable.');
    expect(fixture.disposeCalls).to.eql(1);
  });

  it('retains an already-rejected listener failure over same-turn disposal', async () => {
    const unavailable = new Deno.errors.BadResource('closed keyboard');
    const fixture = keypressOwner({ disposeFailures: 0, iteratorFailure: unavailable });
    const handle = bindWith({ onQuit() {} }, {
      isTerminal: () => true,
      keypress: () => fixture.owner,
    });
    if (!handle) throw new Error('Expected keyboard handle.');
    const outcome = handle.finished.then(
      () => undefined,
      (cause) => cause,
    );

    handle.dispose();

    const failure = await outcome;
    expect(failure).not.to.equal(unavailable);
    expect(errorMessage(failure)).to.eql('Keyboard listener unavailable.');
    expect(fixture.disposeCalls).to.eql(1);
  });

  it('settles a reentrant throwing error handler before successful disposal', async () => {
    const iteratorFailure = new Error('raw iterator failure');
    const handlerFailure = new Error('raw handler failure');
    const fixture = keypressOwner({ disposeFailures: 0, iteratorFailure });
    let observed: unknown;
    const handle = bindWith({
      onQuit() {},
      onError(error) {
        observed = error;
        handle?.dispose();
        throw handlerFailure;
      },
    }, {
      isTerminal: () => true,
      keypress: () => fixture.owner,
    });
    if (!handle) throw new Error('Expected keyboard handle.');

    const failure = await handle.finished.then(
      () => undefined,
      (cause) => cause,
    );
    expect(observed).not.to.equal(iteratorFailure);
    expect(errorMessage(observed)).to.eql('Keyboard listener failed.');
    expect(failure).not.to.equal(handlerFailure);
    expect(errorMessage(failure)).to.eql('Keyboard error handler failed.');
    expect(fixture.disposeCalls).to.eql(1);
  });

  it('keeps finished pending while an admitted key callback is still running', async () => {
    const callbackEntered = Promise.withResolvers<void>();
    const callbackRelease = Promise.withResolvers<void>();
    const fixture = keypressOwner({
      disposeFailures: 0,
      events: [{ key: 'a', ctrlKey: false }],
    });
    let callbackSettled = false;
    const handle = bindWith({
      onQuit() {},
      async onKey() {
        callbackEntered.resolve();
        await callbackRelease.promise;
        callbackSettled = true;
      },
    }, {
      isTerminal: () => true,
      keypress: () => fixture.owner,
    });
    if (!handle) throw new Error('Expected keyboard handle.');

    await callbackEntered.promise;
    handle.dispose();
    let finishedSettled = false;
    void handle.finished.then(() => (finishedSettled = true));
    await Promise.resolve();
    expect(callbackSettled).to.eql(false);
    expect(finishedSettled).to.eql(false);

    callbackRelease.resolve();
    await handle.finished;
    expect(callbackSettled).to.eql(true);
    expect(fixture.nextCalls).to.eql(1);
    expect(fixture.disposeCalls).to.eql(1);
  });

  it('keeps finished pending when lower disposal does not terminate a pending iterator read', async () => {
    const nextEntered = Promise.withResolvers<void>();
    const nextFinished = Promise.withResolvers<IteratorResult<unknown>>();
    let disposed = false;
    let disposeCalls = 0;
    const owner = {
      get disposed() {
        return disposed;
      },
      dispose() {
        disposeCalls += 1;
        disposed = true;
      },
      [Symbol.asyncIterator]() {
        return {
          next() {
            nextEntered.resolve();
            return nextFinished.promise;
          },
        };
      },
    } as unknown as KeypressOwner;
    const handle = bindWith({ onQuit() {} }, {
      isTerminal: () => true,
      keypress: () => owner,
    });
    if (!handle) throw new Error('Expected keyboard handle.');

    await nextEntered.promise;
    handle.dispose();
    let finishedSettled = false;
    void handle.finished.then(() => (finishedSettled = true));
    await Promise.resolve();
    expect(finishedSettled).to.eql(false);
    expect(disposeCalls).to.eql(1);

    nextFinished.resolve({ done: true, value: undefined });
    await handle.finished;
  });

  it('internally owns autonomous finished rejection while retaining retry authority', async () => {
    const fixture = keypressOwner({ disposeFailures: 1, finishImmediately: true });
    const handle = bindWith({ onQuit() {} }, {
      isTerminal: () => true,
      keypress: () => fixture.owner,
    });
    if (!handle) throw new Error('Expected keyboard handle.');

    await Promise.resolve();
    await Promise.resolve();
    handle.dispose();
    expect(fixture.disposeCalls).to.eql(2);
  });

  it('owns Promise reactions after ambient then and catch replacement', async () => {
    for (const key of ['then', 'catch'] as const) {
      const descriptor = Object.getOwnPropertyDescriptor(Promise.prototype, key);
      if (!descriptor) throw new Error(`Expected Promise.prototype.${key} descriptor.`);
      const fixture = keypressOwner({ disposeFailures: 0, finishImmediately: true });
      let ambientCalls = 0;
      let handle: ReturnType<typeof bindWith> | undefined;

      try {
        Object.defineProperty(Promise.prototype, key, {
          ...descriptor,
          value() {
            ambientCalls += 1;
            throw new Error(`ambient Promise.prototype.${key} invoked`);
          },
        });
        handle = bindWith({ onQuit() {} }, {
          isTerminal: () => true,
          keypress: () => fixture.owner,
        });
      } finally {
        Object.defineProperty(Promise.prototype, key, descriptor);
      }

      if (!handle) throw new Error('Expected keyboard handle.');
      await handle.finished;
      expect(ambientCalls).to.eql(0);
      expect(fixture.disposeCalls).to.eql(1);
    }
  });

  it('contains terminal and keypress acquisition throws as fixed package errors', async () => {
    const raw = new Proxy({}, {
      getPrototypeOf() {
        throw new Error('raw proxy trap');
      },
    });
    const until = Promise.reject(raw);
    const terminalFailure = catchSync(() =>
      bindWith({ onQuit() {} }, {
        isTerminal: () => {
          throw raw;
        },
        keypress: () => keypressOwner({ disposeFailures: 0 }).owner,
      })
    );
    const keypressFailure = catchSync(() =>
      bindWith({ onQuit() {}, until }, {
        isTerminal: () => true,
        keypress: () => {
          throw raw;
        },
      })
    );

    expect(terminalFailure).not.to.equal(raw);
    expect(errorMessage(terminalFailure)).to.eql('Keyboard binding failed.');
    expect(keypressFailure).not.to.equal(raw);
    expect(errorMessage(keypressFailure)).to.eql('Keyboard binding failed.');
    await Promise.resolve();
  });

  it('rejects hostile option access before acquiring a keypress owner', () => {
    let keypressCalls = 0;
    let accessorCalls = 0;
    const options = {
      onQuit() {},
      get until() {
        accessorCalls += 1;
        throw new Error('until accessor');
      },
    } as unknown as Parameters<typeof bindWith>[0];

    const failure = catchSync(() =>
      bindWith(options, {
        isTerminal: () => true,
        keypress: () => {
          keypressCalls += 1;
          return keypressOwner({ disposeFailures: 0 }).owner;
        },
      })
    );

    expect(errorMessage(failure)).to.eql('Keyboard binding failed.');
    expect(accessorCalls).to.eql(0);
    expect(keypressCalls).to.eql(0);
  });

  it('interrupt-only forwards q and continues until Ctrl+C quits', async () => {
    const fixture = keypressOwner({
      disposeFailures: 0,
      events: [
        { key: 'q', ctrlKey: false },
        { key: 'r', ctrlKey: false },
        { key: 'c', ctrlKey: true },
      ],
    });
    const keys: string[] = [];
    let quitCalls = 0;
    const handle = bindWith({
      quitKeys: 'interrupt-only',
      onQuit() {
        quitCalls += 1;
      },
      onKey(event) {
        keys.push(`${event.key}:${event.ctrlKey}`);
      },
    }, {
      isTerminal: () => true,
      keypress: () => fixture.owner,
    });
    if (!handle) throw new Error('Expected keyboard handle.');

    await handle.finished;

    expect(keys).to.eql(['q:false', 'r:false']);
    expect(quitCalls).to.eql(1);
    expect(fixture.nextCalls).to.eql(3);
    expect(fixture.disposeCalls).to.eql(1);
  });

  it('validates quit-key grammar before acquiring a keypress owner', () => {
    let keypressCalls = 0;
    const options = {
      onQuit() {},
      quitKeys: 'other',
    } as unknown as Parameters<typeof bindWith>[0];

    const failure = catchSync(() =>
      bindWith(options, {
        isTerminal: () => true,
        keypress: () => {
          keypressCalls += 1;
          return keypressOwner({ disposeFailures: 0 }).owner;
        },
      })
    );

    expect(errorMessage(failure)).to.eql('Keyboard binding failed.');
    expect(keypressCalls).to.eql(0);
  });

  it('rejects hostile quit-key access before acquiring a keypress owner', () => {
    let keypressCalls = 0;
    let accessorCalls = 0;
    const options = {
      onQuit() {},
      get quitKeys() {
        accessorCalls += 1;
        return 'canonical' as const;
      },
    } as unknown as Parameters<typeof bindWith>[0];

    const failure = catchSync(() =>
      bindWith(options, {
        isTerminal: () => true,
        keypress: () => {
          keypressCalls += 1;
          return keypressOwner({ disposeFailures: 0 }).owner;
        },
      })
    );

    expect(errorMessage(failure)).to.eql('Keyboard binding failed.');
    expect(accessorCalls).to.eql(0);
    expect(keypressCalls).to.eql(0);
  });

  it('settles only after pending quit work terminates', async () => {
    const quitEntered = Promise.withResolvers<void>();
    const quitRelease = Promise.withResolvers<void>();
    const fixture = keypressOwner({
      disposeFailures: 0,
      events: [{ key: 'q', ctrlKey: false }],
    });
    const handle = bindWith({
      async onQuit() {
        quitEntered.resolve();
        await quitRelease.promise;
      },
    }, {
      isTerminal: () => true,
      keypress: () => fixture.owner,
    });
    if (!handle) throw new Error('Expected keyboard handle.');

    await quitEntered.promise;
    handle.dispose();
    let settled = false;
    void handle.finished.then(() => (settled = true));
    await Promise.resolve();
    expect(settled).to.eql(false);

    quitRelease.resolve();
    await handle.finished;
  });
});

function errorMessage(input: unknown): string {
  if (!Is.nativeError(input)) throw new Error('Expected native Error.');
  const descriptor = Object.getOwnPropertyDescriptor(input, 'message');
  if (!descriptor || !('value' in descriptor) || !Is.string(descriptor.value)) {
    throw new Error('Expected an own Error message.');
  }
  return descriptor.value;
}

function catchSync(action: () => unknown): unknown {
  try {
    action();
  } catch (cause) {
    return cause;
  }
  throw new Error('Expected synchronous failure.');
}

function keypressOwner(options: {
  disposeFailures: number;
  events?: readonly unknown[];
  finishImmediately?: boolean;
  iteratorFailure?: unknown;
}) {
  const failure = new Error('keypress disposal failed');
  let disposed = false;
  let disposeCalls = 0;
  let eventIndex = 0;
  let iteratorFailed = false;
  let nextCalls = 0;
  let resolveNext: ((result: IteratorResult<unknown>) => void) | undefined;
  const owner = {
    get disposed() {
      return disposed;
    },
    dispose() {
      disposeCalls += 1;
      if (disposeCalls <= options.disposeFailures) throw failure;
      disposed = true;
      resolveNext?.({ done: true, value: undefined });
    },
    [Symbol.asyncIterator]() {
      return {
        next(): Promise<IteratorResult<unknown>> {
          nextCalls += 1;
          if (options.iteratorFailure !== undefined && !iteratorFailed) {
            iteratorFailed = true;
            return Promise.reject(options.iteratorFailure);
          }
          if (eventIndex < (options.events?.length ?? 0)) {
            return Promise.resolve({
              done: false,
              value: options.events?.[eventIndex++],
            });
          }
          if (options.finishImmediately || disposed) {
            return Promise.resolve({ done: true, value: undefined });
          }
          return new Promise((resolve) => {
            resolveNext = resolve;
          });
        },
      };
    },
  } as unknown as KeypressOwner;

  return {
    owner,
    failure,
    get disposeCalls() {
      return disposeCalls;
    },
    get nextCalls() {
      return nextCalls;
    },
  } as const;
}
