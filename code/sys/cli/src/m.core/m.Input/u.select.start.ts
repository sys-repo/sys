import process from 'node:process';
import { Is, type t } from '../common.ts';
import { InputSelect, type NormalizedSelectOptions, normalizeSelectOptions } from './u.select.ts';

type PromptState = { cancelled: boolean };
type SelectReader = NonNullable<t.CliInput.Select.Options<unknown>['reader']>;
type ReadRequest = {
  readonly buffer: Uint8Array;
  readonly resolve: (value: number | null) => void;
  readonly reject: (reason?: unknown) => void;
};

/** Package-internal reader ownership seam for deterministic lifecycle tests. */
export type SelectReaderOwner = {
  readonly reader: SelectReader;
  interrupt(reason: unknown): void;
  dispose(): void;
};

/** Package-internal effects used to start one lifecycle-owned Select prompt. */
export type StartSelectDependencies = {
  createReader(): SelectReaderOwner;
  run<TValue>(
    options: NormalizedSelectOptions<TValue>,
    state: Readonly<PromptState>,
  ): Promise<TValue>;
};

const SELECT_CANCELLED = Symbol('CLI select cancelled');
const DEFAULT_DEPS: StartSelectDependencies = Object.freeze({
  createReader: () => createNodeSelectReader(process.stdin),
  run<TValue>(options: NormalizedSelectOptions<TValue>, state: Readonly<PromptState>) {
    return new ManagedInputSelect(options, state).prompt();
  },
});

let nodeSelectReaderActive = false;

/** Start one cancellable single-selection prompt with an owned input lifecycle. */
export function startSelect<TValue>(
  options: t.CliInput.Select.StartOptions<TValue>,
): t.CliInput.Select.Started<TValue> {
  return startSelectWith(DEFAULT_DEPS, options);
}

/** Package-internal managed Select runner with explicit input effects. */
export function startSelectWith<TValue>(
  deps: StartSelectDependencies,
  options: t.CliInput.Select.StartOptions<TValue>,
): t.CliInput.Select.Started<TValue> {
  const state: PromptState = { cancelled: false };
  const input = deps.createReader();
  let inputDisposed = false;
  const disposeInput = () => {
    if (inputDisposed) return;
    inputDisposed = true;
    input.dispose();
  };

  let normalized: NormalizedSelectOptions<TValue>;
  try {
    normalized = normalizeSelectOptions({
      ...options,
      reader: input.reader,
      validate: () => true,
      transform: (value) => value,
    });
  } catch (cause) {
    try {
      disposeInput();
    } catch {
      // Preserve the option-normalization failure after best-effort reader rollback.
    }
    throw cause;
  }

  let settled = false;

  async function settlePrompt(): Promise<t.CliInput.Select.Outcome<TValue>> {
    let result:
      | { readonly ok: true; readonly value: TValue }
      | { readonly ok: false; readonly cause: unknown };
    let cleanup:
      | { readonly ok: true }
      | { readonly ok: false; readonly cause: unknown } = { ok: true };

    try {
      result = { ok: true, value: await deps.run(normalized, state) };
    } catch (cause) {
      result = { ok: false, cause };
    }

    try {
      disposeInput();
    } catch (cause) {
      cleanup = { ok: false, cause };
    }

    settled = true;
    if (!result.ok) {
      if (result.cause === SELECT_CANCELLED) {
        if (!cleanup.ok) throw cleanup.cause;
        return Object.freeze({ kind: 'cancelled' });
      }
      throw result.cause;
    }
    if (!cleanup.ok) throw cleanup.cause;
    return state.cancelled
      ? Object.freeze({ kind: 'cancelled' })
      : Object.freeze({ kind: 'selected', value: result.value });
  }

  const finished = settlePrompt();
  void finished.catch(() => undefined);
  let disposePromise: Promise<void> | undefined;

  const dispose = (): Promise<void> => {
    return disposePromise ??= (async () => {
      let failed = false;
      let failure: unknown;
      if (!settled) {
        state.cancelled = true;
        try {
          input.interrupt(SELECT_CANCELLED);
        } catch (cause) {
          failed = true;
          failure = cause;
          try {
            disposeInput();
          } catch {
            // Await the prompt below so its settlement remains the owned completion boundary.
          }
        }
      }
      try {
        await finished;
      } catch (cause) {
        if (!failed) {
          failed = true;
          failure = cause;
        }
      }
      if (failed) throw failure;
    })();
  };

  return Object.freeze({
    finished,
    dispose,
    [Symbol.asyncDispose]: dispose,
  });
}

/** Helpers: */

/**
 * Preserve Cliffy's Select rendering and key grammar while suppressing a selection transcript when
 * cancellation wins just after Cliffy has accepted its final input.
 */
class ManagedInputSelect<TValue> extends InputSelect<TValue> {
  readonly #state: Readonly<PromptState>;

  constructor(options: NormalizedSelectOptions<TValue>, state: Readonly<PromptState>) {
    super(options);
    this.#state = state;
  }

  protected override success(value: TValue): string | undefined {
    return this.#state.cancelled ? undefined : super.success(value);
  }
}

/**
 * Adapt Node's evented stdin into Cliffy's Reader contract. Cancellation rejects the current or next
 * read independently of Cliffy's active key grammar; final disposal then releases stream ownership.
 */
function createNodeSelectReader(stream: typeof process.stdin): SelectReaderOwner {
  if (nodeSelectReaderActive) throw inputBusyError();
  nodeSelectReaderActive = true;

  let disposed = false;
  let ended = false;
  let interruption: { readonly reason: unknown } | undefined;
  let pending: ReadRequest | undefined;
  const chunks: Uint8Array[] = [];
  const encoder = new TextEncoder();
  const wasFlowing = stream.readableFlowing;

  const onData = (chunk: Uint8Array | string) => {
    const bytes = Is.string(chunk) ? encoder.encode(chunk) : new Uint8Array(chunk);
    accept(bytes);
  };
  const onEnd = () => fail(inputClosedError());
  const onError = () => fail(inputFailedError());

  try {
    stream.on('data', onData);
    stream.on('end', onEnd);
    stream.on('error', onError);
    stream.resume();
  } catch {
    stream.off('data', onData);
    stream.off('end', onEnd);
    stream.off('error', onError);
    nodeSelectReaderActive = false;
    throw inputFailedError();
  }

  const reader: SelectReader = {
    read(buffer) {
      if (ended || disposed) return Promise.reject(inputClosedError());
      if (interruption) return Promise.reject(interruption.reason);
      const chunk = chunks.shift();
      if (chunk) return Promise.resolve(copy(chunk, buffer));
      if (pending) return Promise.reject(inputFailedError());
      return new Promise<number | null>((resolve, reject) => {
        pending = { buffer, resolve, reject };
      });
    },
    setRaw(mode) {
      stream.setRawMode(mode);
    },
    isTerminal() {
      return stream.isTTY === true;
    },
  };

  return {
    reader,
    interrupt(reason) {
      if (disposed || ended || interruption) return;
      interruption = { reason };
      chunks.length = 0;
      pending?.reject(reason);
      pending = undefined;
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      nodeSelectReaderActive = false;
      let failed = false;
      let failure: unknown;
      const attempt = (run: () => void) => {
        try {
          run();
        } catch (cause) {
          if (!failed) {
            failed = true;
            failure = cause;
          }
        }
      };

      attempt(() => stream.off('data', onData));
      attempt(() => stream.off('end', onEnd));
      attempt(() => stream.off('error', onError));
      if (stream.isTTY) attempt(() => stream.setRawMode(false));
      if (wasFlowing !== true) attempt(() => stream.pause());
      pending?.reject(inputClosedError());
      pending = undefined;
      chunks.length = 0;
      if (failed) throw failure;
    },
  };

  function accept(bytes: Uint8Array): void {
    if (disposed || ended || interruption) return;
    const request = pending;
    if (request) {
      pending = undefined;
      request.resolve(copy(bytes, request.buffer));
      return;
    }
    chunks.push(new Uint8Array(bytes));
  }

  function copy(bytes: Uint8Array, buffer: Uint8Array): number {
    const length = Math.min(bytes.length, buffer.length);
    buffer.set(bytes.subarray(0, length));
    if (length < bytes.length) chunks.unshift(bytes.slice(length));
    return length;
  }

  function fail(error: Error): void {
    if (disposed || ended) return;
    ended = true;
    pending?.reject(error);
    pending = undefined;
    chunks.length = 0;
  }
}

function inputBusyError(): Error {
  return new Error('CLI select input is already owned.');
}

function inputClosedError(): Error {
  return new Error('CLI select input closed.');
}

function inputFailedError(): Error {
  return new Error('CLI select input failed.');
}
