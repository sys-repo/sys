import { CliIs, Is, keypress, type t } from './common.ts';
import { isQuit } from './u.isQuit.ts';
import { isUnavailableError } from './u.isUnavailableError.ts';

type KeypressOwner = ReturnType<typeof keypress>;

type OptionsSnapshot = Readonly<{
  onKey?: t.CliKeyboard.Bind.Options['onKey'];
  onQuit: t.CliKeyboard.Bind.Options['onQuit'];
  until?: PromiseLike<unknown>;
  exit?: boolean;
  onError?: t.CliKeyboard.Bind.Options['onError'];
}>;

export type BindDependencies = Readonly<{
  isTerminal: () => boolean;
  keypress: () => KeypressOwner;
}>;

const DEFAULT_DEPS: BindDependencies = Object.freeze({
  isTerminal: () => CliIs.terminal('stdin'),
  keypress,
});

const NativePromise = Promise;
const NativePromiseThen = NativePromise.prototype.then;
const PromiseSpecies = Symbol.species;
const apply = Reflect.apply;
const defineProperty = Object.defineProperty;
const deleteProperty = Reflect.deleteProperty;
const freeze = Object.freeze;
const REACTION_CONSTRUCTOR = freeze({ [PromiseSpecies]: NativePromise });
const REACTION_CONSTRUCTOR_DESCRIPTOR = freeze({
  configurable: true,
  enumerable: false,
  value: REACTION_CONSTRUCTOR,
  writable: false,
});
const RETAINED_KEYPRESS_OWNERS = new Set<KeypressOwner>();

export function bind(options: t.CliKeyboard.Bind.Options): t.CliKeyboard.Bind.Handle | undefined {
  return bindWith(options, DEFAULT_DEPS);
}

/** Bind with an explicit keypress owner for lifecycle tests. */
export function bindWith(
  options: t.CliKeyboard.Bind.Options,
  deps: BindDependencies,
): t.CliKeyboard.Bind.Handle | undefined {
  const snapshot = snapshotOptions(options);
  let terminal: boolean;
  try {
    terminal = deps.isTerminal();
  } catch {
    throw bindingError();
  }
  if (!terminal) return undefined;

  let cancellationRequested = false;
  let requestCancellation = () => {
    cancellationRequested = true;
  };
  if (snapshot.until) {
    try {
      const until = new NativePromise<unknown>((resolve) => resolve(snapshot.until));
      observePromise(
        until,
        () => requestCancellation(),
        () => requestCancellation(),
      );
    } catch {
      throw bindingError();
    }
  }

  let keys: KeypressOwner;
  try {
    keys = deps.keypress();
  } catch {
    throw bindingError();
  }

  let stopRequested = false;
  let disposalAccepted = false;
  let listenerSettled = false;
  let finishedSettled = false;
  let listenerFailure: Error | undefined;
  let disposalFailure: Error | undefined;
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  let finished: Promise<void>;
  try {
    finished = new NativePromise<void>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    // The autonomous listener owns its rejection even when a caller does not observe `finished`.
    observePromise(finished, undefined, () => undefined);
  } catch {
    retainAndStop(keys);
    throw bindingError();
  }

  const settleFinished = () => {
    if (!listenerSettled || finishedSettled) return;
    finishedSettled = true;
    const failure = listenerFailure ?? disposalFailure;
    failure ? reject(failure) : resolve();
  };
  const recordListenerFailure = (message: string) => {
    listenerFailure ??= new Error(message);
  };

  // Stop request, lower disposal acceptance, and listener settlement are separate facts. A request
  // gates new work immediately, while a failed lower disposal remains retryable.
  const dispose = () => {
    stopRequested = true;
    if (disposalAccepted) return;
    try {
      if (!keys.disposed) keys.dispose();
    } catch {
      const error = new Error('Keyboard disposal failed.');
      disposalFailure = error;
      settleFinished();
      throw error;
    }
    disposalAccepted = true;
    disposalFailure = undefined;
    settleFinished();
  };
  const attemptDispose = () => {
    try {
      dispose();
    } catch {
      // `dispose` records only fixed package-owned evidence and leaves the same handle retryable.
    }
  };
  requestCancellation = attemptDispose;
  if (cancellationRequested) attemptDispose();

  const reportListenerFailure = async (unavailable: boolean) => {
    if (unavailable) {
      recordListenerFailure('Keyboard listener unavailable.');
      return;
    }
    if (!snapshot.onError) {
      recordListenerFailure('Keyboard listener failed.');
      return;
    }
    try {
      await snapshot.onError(new Error('Keyboard listener failed.'));
    } catch {
      recordListenerFailure('Keyboard error handler failed.');
    }
  };

  const listening = (async () => {
    try {
      let iteratorResult:
        | Readonly<{ kind: 'value'; value: ReturnType<KeypressOwner[typeof Symbol.asyncIterator]> }>
        | Readonly<{ kind: 'failed' }>;
      try {
        iteratorResult = { kind: 'value', value: keys[Symbol.asyncIterator]() };
      } catch {
        iteratorResult = { kind: 'failed' };
      }
      if (iteratorResult.kind === 'failed') {
        await reportListenerFailure(false);
        return;
      }

      const iterator = iteratorResult.value;
      const readNext = async () => {
        try {
          return { kind: 'value' as const, value: await iterator.next() };
        } catch (cause) {
          return { kind: 'failed' as const, cause };
        }
      };

      while (!stopRequested) {
        const next = await readNext();
        if (next.kind === 'failed') {
          await reportListenerFailure(isUnavailableError(next.cause));
          return;
        }

        try {
          if (stopRequested) return;
          if (next.value.done) return;
          const event = next.value.value;
          if (isQuit(event)) {
            await snapshot.onQuit();
            if (snapshot.exit ?? false) Deno.exit(0);
            return;
          }
          await snapshot.onKey?.(event);
        } catch {
          await reportListenerFailure(false);
          return;
        }
      }
    } catch {
      recordListenerFailure('Keyboard listener failed.');
    } finally {
      listenerSettled = true;
      attemptDispose();
      settleFinished();
    }
  })();
  try {
    observePromise(listening, undefined, () => {
      try {
        recordListenerFailure('Keyboard listener failed.');
        listenerSettled = true;
        settleFinished();
      } catch {
        // The listener and keypress owner remain retained by their active closure.
      }
    });
  } catch {
    retainAndStop(keys);
    throw bindingError();
  }

  return { dispose, finished };
}

/**
 * Helpers:
 */
function snapshotOptions(input: t.CliKeyboard.Bind.Options): OptionsSnapshot {
  try {
    if (!Is.object(input) || Is.proxy(input)) throw bindingError();
    const onKey = ownValue(input, 'onKey');
    const onQuit = ownValue(input, 'onQuit');
    const until = ownValue(input, 'until');
    const exit = ownValue(input, 'exit');
    const onError = ownValue(input, 'onError');
    if (onKey !== undefined && !Is.func(onKey)) throw bindingError();
    if (!Is.func(onQuit)) throw bindingError();
    if (exit !== undefined && !Is.bool(exit)) throw bindingError();
    if (onError !== undefined && !Is.func(onError)) throw bindingError();
    return Object.freeze({ onKey, onQuit, until, exit, onError });
  } catch {
    throw bindingError();
  }
}

function ownValue<K extends keyof t.CliKeyboard.Bind.Options>(
  input: object,
  key: K,
): t.CliKeyboard.Bind.Options[K] | undefined {
  const descriptor = Object.getOwnPropertyDescriptor(input, key);
  if (!descriptor) return undefined;
  if (!('value' in descriptor)) throw bindingError();
  return descriptor.value;
}

function observePromise<T>(
  promise: Promise<T>,
  fulfilled: ((value: T) => void) | undefined,
  rejected: ((cause: unknown) => void) | undefined,
): void {
  defineProperty(promise, 'constructor', REACTION_CONSTRUCTOR_DESCRIPTOR);
  let failed = false;
  try {
    void apply(NativePromiseThen, promise, [fulfilled, rejected]);
  } catch {
    failed = true;
  }
  if (!deleteProperty(promise, 'constructor')) failed = true;
  if (failed) throw bindingError();
}

function retainAndStop(keys: KeypressOwner): void {
  RETAINED_KEYPRESS_OWNERS.add(keys);
  try {
    if (!keys.disposed) keys.dispose();
  } catch {
    // Retention preserves lower ownership when synchronous rollback cannot prove absence.
  }
}

function bindingError(): Error {
  return new Error('Keyboard binding failed.');
}
