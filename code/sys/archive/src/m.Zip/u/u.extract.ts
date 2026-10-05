import { Dispose, Is, type t } from '../common.ts';
import type { ExtractionControl, ExtractionSource, OperationContext, ParsedArchive } from './t.ts';
import { failure, isFailure } from './u.failure.ts';
import { workOptions } from './u.input.ts';
import { operation, operationStart } from './u.operation.ts';
import { payloadPass, testPayloads } from './u.payload.ts';
import { extractionSource } from './u.extract.source.ts';

const apply = Reflect.apply;
const ownKeys = Reflect.ownKeys;
const prototypeOf = Object.getPrototypeOf;
const descriptorOf = Object.getOwnPropertyDescriptor;
const objectPrototype = Object.prototype;
const STOPPED = Symbol('zip-extraction-stopped');

/** Compose archive-private bytes with one supplied tree sink; owns no filesystem capability. */
export async function extractTo(
  bytes: Uint8Array,
  parsed: ParsedArchive,
  sinkInput: unknown,
  optionsInput: unknown,
  limits: t.Zip.Limits,
): Promise<t.Zip.ExtractResult> {
  const started = operationStart();
  const options = workOptions(optionsInput, limits.maxErrorChars, 'extract');
  const sink = captureSink(sinkInput, limits.maxErrorChars);
  return await operation('extract', options, limits, async (context) => {
    const life = Dispose.abortable();
    let active = true;
    let terminal: t.Zip.Failure.Error | undefined;
    let wake: (() => void) | undefined;
    let completed = 0;
    let result: t.Zip.ExtractResult | undefined;
    const sources: ExtractionSource[] = [];
    const select = (error: t.Zip.Failure.Error) => {
      // Success and failure both close admission before any cleanup can re-enter the sources.
      if (!active) return terminal ?? error;
      terminal = error;
      active = false;
      life.dispose();
      wake?.();
      return terminal;
    };
    const fail: ExtractionControl['fail'] = (kind, entryIndex, cause) =>
      select(failure('extract', kind, {
        maxErrorChars: limits.maxErrorChars,
        entryIndex,
        cause,
      }));
    const check = (entryIndex?: number) => {
      if (terminal) throw terminal;
      if (!active) {
        throw failure('extract', 'sink-protocol', {
          maxErrorChars: limits.maxErrorChars,
          entryIndex,
        });
      }
      try {
        context.checkpoint(entryIndex);
      } catch (cause) {
        throw select(
          isFailure(cause)
            ? cause
            : failure('extract', 'malformed', { maxErrorChars: limits.maxErrorChars, cause }),
        );
      }
    };
    const onAbort = () => {
      try {
        check();
      } catch { /* Select and signal the owner-controlled lifecycle terminal. */ }
    };
    context.signal.addEventListener('abort', onAbort, { once: true });
    const work: OperationContext = {
      ...context,
      signal: life.signal,
      checkpoint: check,
      async yieldTurn(entryIndex) {
        await context.yieldTurn(entryIndex);
        check(entryIndex);
      },
    };
    const control: ExtractionControl = {
      context: work,
      check,
      fail,
      payloadFailure(cause, entryIndex) {
        if (terminal) return terminal;
        return fail(isFailure(cause) ? cause.kind : 'malformed', entryIndex, cause);
      },
      claim(ordinal) {
        check();
        if (ordinal !== completed) throw fail('sink-protocol');
      },
      completed() {
        completed++;
      },
    };
    try {
      // Integrity preflight completes before any sink method or content source becomes executable.
      const tested = await testPayloads(bytes, parsed.entries, work);
      const pass = payloadPass(bytes, work);
      const directories = new Set<string>();
      const files: t.Zip.Extract.TreeFile[] = [];
      let records = 0;
      const tick = async () => {
        check();
        if (++records % 32 === 0) await work.yieldTurn();
      };
      for (const entry of parsed.entries) {
        const metadata = entry.metadata;
        const path = metadata.kind === 'directory' ? metadata.path.slice(0, -1) : metadata.path;
        // Admitted slash positions supply explicit parents without filesystem path interpretation.
        let separator = path.indexOf('/');
        while (separator >= 0) {
          directories.add(path.slice(0, separator));
          await tick();
          separator = path.indexOf('/', separator + 1);
        }
        if (metadata.kind === 'directory') directories.add(path);
        else {
          const source = extractionSource(entry, files.length, pass, control);
          sources.push(source);
          files.push(
            Object.freeze({
              kind: 'file',
              path,
              expectedBytes: metadata.expandedBytes,
              content: source.content,
            }),
          );
        }
        if (directories.size + files.length > limits.maxTreeEntries) throw fail('tree-limit');
        await tick();
      }
      const entries: t.Zip.Extract.TreeEntry[] = [];
      for (const path of directories) {
        entries.push(Object.freeze({ kind: 'directory', path }));
        await tick();
      }
      for (const file of files) {
        entries.push(file);
        await tick();
      }
      if (entries.length !== parsed.inspection.treeEntryCount) throw fail('tree-limit');
      const batch = Object.freeze(entries);
      check();
      const timeout = Math.max(1, Math.ceil(options.timeout - (operationStart() - started)));
      const sinkOptions: t.Zip.Extract.TreeSinkOptions = Object.freeze({
        maxEntries: limits.maxTreeEntries,
        maxPathBytes: limits.maxPathBytes,
        maxPathDepth: limits.maxPathDepth,
        maxFileBytes: limits.maxEntryBytes,
        maxTreeBytes: limits.maxExpandedBytes,
        until: life.signal,
        timeout,
      });
      const interrupted = new Promise<typeof STOPPED>((resolve) => {
        wake = () => resolve(STOPPED);
      });
      // Both observers select their outcome before another continuation or any cleanup can run.
      const written = (async () => {
        try {
          await sink.writeTree(batch, sinkOptions);
        } catch (cause) {
          // A non-preemptible sink prefix may exhaust its budget before its promise rejects.
          try {
            check();
          } catch {
            return;
          }
          fail('sink-failure', undefined, cause);
          return;
        }
        if (!active) return; // A late fulfillment cannot rescue an already-stopped operation.
        check();
        if (completed !== files.length || sources.some((source) => !source.complete())) {
          throw fail('sink-protocol');
        }
        result = Object.freeze({
          kind: 'extracted',
          fileCount: files.length,
          directoryCount: directories.size,
          treeEntryCount: entries.length,
          expandedBytes: tested.expandedBytes,
        });
        active = false;
      })();
      check(); // The sink's synchronous prefix may itself cancel or exhaust the budget.
      await Promise.race([written, interrupted]);
    } catch (cause) {
      select(
        isFailure(cause)
          ? cause
          : failure('extract', 'malformed', { maxErrorChars: limits.maxErrorChars, cause }),
      );
    } finally {
      active = false;
      context.signal.removeEventListener('abort', onAbort);
      life.dispose();
      // Join every owned demand/inflater even when the external sink never settles.
      for (const source of sources) {
        try {
          await source.stop();
        } catch (cause) {
          if (!terminal) {
            select(failure('extract', 'malformed', { maxErrorChars: limits.maxErrorChars, cause }));
          }
        }
      }
      wake = undefined;
    }
    if (terminal || !result) throw terminal ?? fail('malformed');
    return result;
  }, started);
}

/** Snapshot one exact sink method without executing getters, proxy traps, or caller methods. */
function captureSink(input: unknown, maxErrorChars: number): t.Zip.Extract.TreeSink {
  try {
    if (!Is.object(input) || Is.Native.proxy(input) || prototypeOf(input) !== objectPrototype) {
      throw new Error();
    }
    const keys = ownKeys(input);
    const descriptor = descriptorOf(input, 'writeTree');
    if (
      keys.length !== 1 || keys[0] !== 'writeTree' || !descriptor || !('value' in descriptor) ||
      descriptor.enumerable !== true
    ) throw new Error();
    const method: unknown = descriptor.value;
    if (!Is.func(method) || Is.Native.proxy(method)) throw new Error();
    return {
      writeTree: (entries, options) => apply(method, input, [entries, options]),
    };
  } catch (cause) {
    throw failure('extract', 'invalid-sink', { maxErrorChars, cause });
  }
}
