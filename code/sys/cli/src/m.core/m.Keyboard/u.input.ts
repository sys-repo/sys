import process from 'node:process';
import { parse } from '@cliffy/keycode';
import { KeyPressEvent } from '@cliffy/keypress';
import type { KeyboardInput, KeyboardInputDependencies, KeyboardInputStream } from './t.input.ts';

type Pull = ReturnType<typeof Promise.withResolvers<IteratorResult<KeyPressEvent>>>;
type NativeInput = KeyboardInput & { readonly finished: Promise<void> };

let shared: NativeInput | undefined;

/** Managed bindings compete for one session; raw Cliffy input remains a separate API. */
export function input(): NativeInput {
  if (!shared || shared.disposed) {
    shared = createInput({
      stdin: () => process.stdin,
      afterPause: (callback) => process.nextTick(callback),
    });
  }
  return shared;
}

/** Private native-input owner with a deterministic acquisition/release seam. */
export function createInput(deps: KeyboardInputDependencies): NativeInput {
  let completion = Promise.withResolvers<void>();
  void completion.promise.catch(() => undefined);
  let completionSettled = false;
  let releaseFailure: Error | undefined;
  const pulls: Pull[] = [];
  const events: KeyPressEvent[] = [];
  let stream: KeyboardInputStream | undefined;
  let started = false;
  let stopping = false;
  let released = false;
  let pauseNeeded = false;
  let rawNeeded = false;
  let rawBefore = false;
  let dataAttached = false;
  let endAttached = false;
  let errorAttached = false;
  let barrierPending = false;
  let lastEvent: KeyPressEvent | undefined;
  let inputFailed = false;
  let inputFailure: unknown;
  let failureDelivered = false;

  const onError = (cause: unknown) => {
    if (!inputFailed) {
      inputFailed = true;
      inputFailure = cause;
    }
    for (const pull of pulls.splice(0)) {
      failureDelivered = true;
      pull.reject(inputFailure);
    }
    stop();
  };
  const onEnd = () => stop();
  const onData = (chunk: Uint8Array) => {
    if (stopping) return;
    try {
      stream?.pause();
    } catch (cause) {
      onError(cause);
      return;
    }

    // Decode each stream chunk in windows of at most eight bytes with Cliffy's parser.
    // Incomplete sequences are not buffered across windows; native chunk boundaries may differ
    // from Cliffy's stdin reads. Retain its event fields and repeat calculation.
    for (let offset = 0; offset < chunk.length; offset += 8) {
      let decoded: ReturnType<typeof parse>;
      try {
        decoded = parse(chunk.subarray(offset, offset + 8));
      } catch {
        continue;
      }
      for (const key of decoded) {
        const event = new KeyPressEvent('keydown', {
          ...key,
          cancelable: true,
          repeat: lastEvent && lastEvent.sequence === key.sequence &&
            Date.now() - lastEvent.timeStamp < 100,
        });
        lastEvent = event;
        const pull = pulls.shift();
        if (pull) pull.resolve({ done: false, value: event });
        else events.push(event);
      }
    }
    if (pulls.length) resume();
  };

  const resume = () => {
    try {
      pauseNeeded = true;
      stream?.resume();
    } catch (cause) {
      onError(cause);
    }
  };
  const start = () => {
    if (started) return;
    started = true;
    try {
      stream = deps.stdin();
      rawBefore = stream.isRaw;
      rawNeeded = true;
      stream.setRawMode(true);
      errorAttached = true;
      stream.on('error', onError);
      endAttached = true;
      stream.on('end', onEnd);
      dataAttached = true;
      pauseNeeded = true; // Adding a data listener can schedule resume before returning.
      stream.on('data', onData);
    } catch (cause) {
      onError(cause);
    }
  };

  const rejectRelease = () => {
    releaseFailure ??= new Error('Keyboard input release failed.');
    completionSettled = true;
    completion.reject(releaseFailure);
  };
  const dispose = () => {
    stopping = true;
    events.length = 0;
    for (const pull of pulls.splice(0)) pull.resolve({ done: true, value: undefined });
    if (released) return;
    if (completionSettled) {
      completion = Promise.withResolvers<void>();
      void completion.promise.catch(() => undefined);
      completionSettled = false;
    }

    let failed = false;
    const release = (action: () => void) => {
      try {
        action();
      } catch {
        failed = true;
      }
    };
    if (pauseNeeded) {
      release(() => {
        stream?.pause();
        pauseNeeded = false;
      });
    }
    if (dataAttached) {
      release(() => {
        stream?.removeListener('data', onData);
        dataAttached = false;
      });
    }
    if (endAttached) {
      release(() => {
        stream?.removeListener('end', onEnd);
        endAttached = false;
      });
    }
    if (rawNeeded) {
      release(() => {
        stream?.setRawMode(rawBefore);
        rawNeeded = false;
      });
    }

    if (!pauseNeeded && !barrierPending) {
      barrierPending = true;
      try {
        // stdin's pause handler queues native readStop on nextTick. Follow it, including a
        // resume already queued by same-turn acquisition; a microtask alone is not that barrier.
        deps.afterPause(() => {
          barrierPending = false;
          if (errorAttached) {
            release(() => {
              stream?.removeListener('error', onError);
              errorAttached = false;
            });
          }
          released = !pauseNeeded && !dataAttached && !endAttached && !errorAttached && !rawNeeded;
          if (!released) rejectRelease();
          else {
            completionSettled = true;
            completion.resolve();
          }
        });
      } catch {
        barrierPending = false;
        failed = true;
      }
    }
    if (failed) {
      if (!barrierPending) rejectRelease();
      throw new Error('Keyboard input release failed.');
    }
  };
  const stop = () => {
    try {
      dispose();
    } catch {
      // The binding's finally/shutdown path retries this retained owner and reports failure.
    }
  };

  const owner: NativeInput = {
    get disposed() {
      return released;
    },
    get finished() {
      return completion.promise;
    },
    get releaseFailure() {
      return releaseFailure;
    },
    takeInputFailure() {
      if (!inputFailed || failureDelivered) return;
      failureDelivered = true;
      return { cause: inputFailure };
    },
    dispose,
    [Symbol.asyncIterator]() {
      return {
        next() {
          if (inputFailed) {
            failureDelivered = true;
            return Promise.reject(inputFailure);
          }
          if (stopping) return Promise.resolve({ done: true, value: undefined });
          const event = events.shift();
          if (event) return Promise.resolve({ done: false, value: event });
          const pull = Promise.withResolvers<IteratorResult<KeyPressEvent>>();
          pulls.push(pull);
          start();
          if (!stopping) resume();
          return pull.promise;
        },
      };
    },
  };
  return owner;
}
