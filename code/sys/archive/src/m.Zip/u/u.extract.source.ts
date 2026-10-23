import { Dispose, type t } from '../common.ts';
import type {
  ExtractionControl,
  ExtractionSource,
  OperationContext,
  ParsedEntry,
  PayloadPass,
} from './t.ts';
import { failure } from './u.failure.ts';

// The coordinating signal crosses the sink boundary; never consult its shadowable methods.
const addListener = EventTarget.prototype.addEventListener;
const removeListener = EventTarget.prototype.removeEventListener;

/** One-use iterable with explicit demand admission outside the native generator's queued methods. */
export function extractionSource(
  entry: ParsedEntry,
  ordinal: number,
  pass: PayloadPass,
  control: ExtractionControl,
): ExtractionSource {
  const index = entry.metadata.index;
  let acquired = false;
  let finished = false;
  let revoked = false;
  let life: t.Abortable | undefined;
  let reader: AsyncGenerator<Uint8Array> | undefined;
  let pending: Promise<IteratorResult<Uint8Array>> | undefined;
  let closing: Promise<void> | undefined;
  let incomplete: t.Zip.Failure.Error | undefined;
  const abort = () => life?.dispose();
  const done = (): IteratorResult<Uint8Array> => ({ done: true, value: undefined });
  const check = () => {
    control.check(index);
    if (revoked) throw control.fail('sink-protocol', index);
  };
  const checkpoint = () => {
    control.check(index);
    if (revoked) {
      // Only an already-admitted demand interrupted by return uses this unlatched cleanup reason.
      incomplete ??= failure('extract', 'sink-protocol', {
        maxErrorChars: control.context.limits.maxErrorChars,
        entryIndex: index,
      });
      throw incomplete;
    }
  };
  const stop = (): Promise<void> => {
    if (closing) return closing;
    revoked = true;
    life?.dispose();
    closing = (async () => {
      // Native return queues behind next: abort first, join demand, then close the generator.
      if (pending) {
        try {
          await pending;
        } catch { /* Observe the demand's primary failure or incomplete-consumption cleanup. */ }
      }
      try {
        await reader?.return(undefined);
      } catch {
        // Observe native close rejection; early return stays incomplete and cannot replace a primary.
      } finally {
        removeListener.call(control.context.signal, 'abort', abort);
        life?.dispose();
      }
    })();
    return closing;
  };
  const content: AsyncIterable<Uint8Array> = Object.freeze({
    [Symbol.asyncIterator]() {
      check();
      if (acquired) throw control.fail('sink-protocol', index);
      control.claim(ordinal);
      acquired = true;
      life = Dispose.abortable();
      addListener.call(control.context.signal, 'abort', abort, { once: true });
      const context: OperationContext = {
        ...control.context,
        signal: life.signal,
        checkpoint,
        async yieldTurn() {
          await control.context.yieldTurn(index);
          checkpoint();
        },
      };
      reader = pass.read(entry, context);
      const iterator: AsyncIterableIterator<Uint8Array> = {
        [Symbol.asyncIterator]() {
          check();
          return iterator;
        },
        next() {
          try {
            check();
            if (finished) return Promise.resolve(done());
            if (pending) throw control.fail('sink-protocol', index);
            // Return this exact promise: an async wrapper would leave a second unchecked
            // public settlement after the demand slot and final checkpoint have completed.
            pending = (async () => {
              try {
                const result = await reader!.next();
                checkpoint();
                if (result.done) {
                  finished = true;
                  control.completed();
                  removeListener.call(control.context.signal, 'abort', abort);
                  life?.dispose();
                }
                return result;
              } catch (cause) {
                if (incomplete && cause === incomplete) {
                  control.check(index);
                  throw cause;
                }
                throw control.payloadFailure(cause, index);
              } finally {
                pending = undefined;
              }
            })();
            return pending;
          } catch (cause) {
            return Promise.reject(cause);
          }
        },
        async return() {
          check();
          if (finished) return done();
          // Return can interrupt pending next; cleanup itself never selects a sink terminal.
          await stop();
          return done();
        },
      };
      return Object.freeze(iterator);
    },
  });
  return { content, complete: () => finished, stop };
}
