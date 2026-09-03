import { deflateRawSync } from 'node:zlib';
import { describe, expect, it, type t, Time } from '../../-test.ts';
import { deadlineTimerMsecs, operation, type OperationContext } from '../u/u.operation.ts';
import { parseZip } from '../u/u.parse.ts';
import {
  createInflater,
  INFLATE_BLOCK_BYTES,
  INFLATE_READABLE_HIGH_WATER_BYTES,
  type InflaterWriter,
  testPayloads,
  writeInflater,
} from '../u/u.payload.ts';
import { zip } from './u.fixture.ts';

const MIB = 1024 * 1024;
const LIMITS: t.Zip.Limits = Object.freeze({
  maxSourceBytes: 4 * MIB,
  maxEntries: 2048,
  maxTreeEntries: 8192,
  maxPathBytes: 512,
  maxPathDepth: 32,
  maxEntryBytes: 2 * MIB,
  maxExpandedBytes: 3 * MIB,
  maxErrorChars: 1000,
});

type ContextFixture = {
  readonly context: OperationContext;
  readonly yields: () => number;
};

type Listener = (cause?: unknown) => void;

/** Make callback, drain, error, and close ordering deterministic. */
class BackpressureWriter implements InflaterWriter {
  readonly #listeners = new Map<string, Listener>();
  #callback?: (error?: Error | null) => void;

  write(_bytes: Uint8Array, callback: (error?: Error | null) => void): boolean {
    this.#callback = callback;
    return false;
  }

  once(event: string, listener: Listener): this {
    this.#listeners.set(event, listener);
    return this;
  }

  removeListener(event: string, listener: Listener): this {
    if (this.#listeners.get(event) === listener) this.#listeners.delete(event);
    return this;
  }

  callback(error?: Error): void {
    this.#callback?.(error);
  }

  emit(event: string, cause?: unknown): void {
    const listener = this.#listeners.get(event);
    this.#listeners.delete(event);
    listener?.(cause);
  }

  listenerCount(): number {
    return this.#listeners.size;
  }
}

/** Build an operation context with observable cooperative yields. */
function context(
  controller = new AbortController(),
  onYield?: () => void,
): ContextFixture {
  let count = 0;
  const checkpoint = () => {
    if (controller.signal.aborted) throw controller.signal.reason;
  };
  return {
    context: Object.freeze({
      operation: 'test',
      limits: LIMITS,
      signal: controller.signal,
      checkpoint,
      async yieldTurn() {
        count++;
        onYield?.();
        await Promise.resolve();
        checkpoint();
      },
    }),
    yields: () => count,
  };
}

describe('@sys/archive/zip: bounded work', () => {
  describe('monotonic deadlines', () => {
    it('rounds positive fractional remainders into bounded host timers', () => {
      expect(deadlineTimerMsecs(0.001)).to.eql(1);
      expect(deadlineTimerMsecs(123.5)).to.eql(124);
      expect(deadlineTimerMsecs(Time.Delay.MAX)).to.eql(Time.Delay.MAX);
      expect(deadlineTimerMsecs(Time.Delay.MAX + 0.5)).to.eql(Time.Delay.MAX);
    });

    it('reports a typed timeout when the monotonic deadline expires', async () => {
      let entered = false;
      let observed: unknown;
      try {
        await operation('test', { timeout: 50 }, LIMITS, async (operationContext) => {
          entered = true;
          await Time.wait(100);
          operationContext.checkpoint();
        });
      } catch (error) {
        observed = error;
      }
      expect(entered).to.eql(true);
      expect(observed).to.include({ name: 'ZipError', operation: 'test', kind: 'timeout' });
    });
  });

  describe('inflater backpressure and settlement', () => {
    it('keeps one readable chunk within 64-KiB write and output bounds', async () => {
      const data = new Uint8Array(4 * INFLATE_BLOCK_BYTES);
      const compressed = new Uint8Array(deflateRawSync(data));
      const inflater = createInflater();
      const chunks: number[] = [];
      const closed = new Promise<void>((resolve) => inflater.once('close', resolve));
      const consume = (async () => {
        for await (const chunk of inflater) chunks.push((chunk as Uint8Array).byteLength);
      })();

      expect(inflater.readableHighWaterMark).to.eql(INFLATE_READABLE_HIGH_WATER_BYTES);
      expect(inflater.writableHighWaterMark).to.eql(INFLATE_BLOCK_BYTES);
      expect(inflater.readableFlowing).not.to.eql(true);
      for (let offset = 0; offset < compressed.byteLength; offset += INFLATE_BLOCK_BYTES) {
        await writeInflater(
          inflater,
          compressed.subarray(
            offset,
            Math.min(offset + INFLATE_BLOCK_BYTES, compressed.byteLength),
          ),
        );
      }
      inflater.end();
      await consume;
      if (!inflater.destroyed) inflater.destroy();
      await closed;

      expect(chunks.length).to.be.greaterThan(1);
      expect(Math.max(...chunks)).to.be.at.most(INFLATE_BLOCK_BYTES);
    });

    it('holds write settlement for both callback and required drain in either order', async () => {
      const callbackFirst = new BackpressureWriter();
      let callbackFirstSettled = false;
      const callbackFirstPending = writeInflater(callbackFirst, new Uint8Array([1])).then(
        () => void (callbackFirstSettled = true),
      );
      callbackFirst.callback();
      await Promise.resolve();
      expect(callbackFirstSettled).to.eql(false);
      callbackFirst.emit('drain');
      await callbackFirstPending;
      expect(callbackFirstSettled).to.eql(true);
      expect(callbackFirst.listenerCount()).to.eql(0);

      const drainFirst = new BackpressureWriter();
      let drainFirstSettled = false;
      const drainFirstPending = writeInflater(drainFirst, new Uint8Array([1])).then(
        () => void (drainFirstSettled = true),
      );
      drainFirst.emit('drain');
      await Promise.resolve();
      expect(drainFirstSettled).to.eql(false);
      drainFirst.callback();
      await drainFirstPending;
      expect(drainFirstSettled).to.eql(true);
      expect(drainFirst.listenerCount()).to.eql(0);
    });

    it('rejects callback, stream-error, and premature-close failures without retaining listeners', async () => {
      const callbackFailure = new BackpressureWriter();
      const callbackCause = new Error('callback failed');
      const callbackPending = writeInflater(callbackFailure, new Uint8Array([1])).then(
        () => undefined,
        (cause) => cause,
      );
      callbackFailure.emit('drain');
      callbackFailure.callback(callbackCause);
      expect(await callbackPending).to.equal(callbackCause);
      expect(callbackFailure.listenerCount()).to.eql(0);

      const streamFailure = new BackpressureWriter();
      const streamCause = new Error('stream failed');
      const streamPending = writeInflater(streamFailure, new Uint8Array([1])).then(
        () => undefined,
        (cause) => cause,
      );
      streamFailure.emit('error', streamCause);
      expect(await streamPending).to.equal(streamCause);
      expect(streamFailure.listenerCount()).to.eql(0);

      const prematureClose = new BackpressureWriter();
      const closePending = writeInflater(prematureClose, new Uint8Array([1])).then(
        () => undefined,
        (cause) => cause,
      );
      prematureClose.emit('close');
      expect(await closePending).to.be.instanceOf(Error);
      expect(prematureClose.listenerCount()).to.eql(0);
    });

    it('bounds native pending input and output under a fast feeder and slow consumer', async () => {
      const data = pseudoRandomBytes(2 * MIB);
      const compressed = new Uint8Array(deflateRawSync(data));
      const inflater = createInflater();
      const closed = new Promise<void>((resolve) => inflater.once('close', resolve));
      let expanded = 0;
      let maxReadable = 0;
      let maxWritable = 0;

      const consume = (async () => {
        for await (const value of inflater) {
          const chunk = value as Uint8Array;
          expanded += chunk.byteLength;
          maxReadable = Math.max(maxReadable, inflater.readableLength);
          await Time.wait(1);
          maxReadable = Math.max(maxReadable, inflater.readableLength);
        }
      })();

      for (let offset = 0; offset < compressed.byteLength; offset += INFLATE_BLOCK_BYTES) {
        const block = compressed.subarray(
          offset,
          Math.min(offset + INFLATE_BLOCK_BYTES, compressed.byteLength),
        );
        await writeInflater(inflater, block);
        maxWritable = Math.max(maxWritable, inflater.writableLength);
      }
      inflater.end();
      await consume;
      if (!inflater.destroyed) inflater.destroy();
      await closed;

      expect(expanded).to.eql(data.byteLength);
      expect(maxWritable).to.be.at.most(INFLATE_BLOCK_BYTES);
      expect(maxReadable).to.be.greaterThan(0);
      expect(maxReadable).to.be.at.most(INFLATE_BLOCK_BYTES);
      expect(inflater.readableFlowing).not.to.eql(true);
    });
  });

  describe('cooperative parser and payload scheduling', () => {
    it('yields after at most 32 parsed central and local records', async () => {
      const fifteen = zip(
        Array.from({ length: 15 }, (_, index) => ({ name: `entry-${index}` })),
      );
      const before = context();
      await parseZip(fifteen.bytes, LIMITS, before.context);
      expect(before.yields()).to.eql(0);

      const sixteen = zip(
        Array.from({ length: 16 }, (_, index) => ({ name: `entry-${index}` })),
      );
      const boundary = context();
      await parseZip(sixteen.bytes, LIMITS, boundary.context);
      expect(boundary.yields()).to.eql(1);
    });

    it('observes cancellation at the parser record boundary', async () => {
      const fixture = zip(
        Array.from({ length: 32 }, (_, index) => ({ name: `entry-${index}` })),
      );
      const controller = new AbortController();
      const stop = new Error('stop at parse quantum');
      const parseContext = context(controller, () => controller.abort(stop));
      let observed: unknown;
      try {
        await parseZip(fixture.bytes, LIMITS, parseContext.context);
      } catch (error) {
        observed = error;
      }
      expect(observed).to.equal(stop);
      expect(parseContext.yields()).to.eql(1);
    });

    it('yields once when stored payload work reaches the 1-MiB boundary', async () => {
      const data = new Uint8Array(MIB);
      const fixture = zip([{ name: 'one-mib.bin', data }]);
      const parseContext = context();
      const parsed = await parseZip(fixture.bytes, LIMITS, parseContext.context);
      const payloadContext = context();
      const result = await testPayloads(fixture.bytes, parsed.entries, payloadContext.context);
      expect(result.expandedBytes).to.eql(MIB);
      expect(payloadContext.yields()).to.eql(1);
    });

    it('revokes and settles an active inflater when cancellation arrives at a payload yield', async () => {
      const data = new Uint8Array(MIB);
      const fixture = zip([{ name: 'cancel.bin', data, method: 8 }]);
      const parseContext = context();
      const parsed = await parseZip(fixture.bytes, LIMITS, parseContext.context);
      const controller = new AbortController();
      const stop = new Error('stop at payload quantum');
      const payloadContext = context(controller, () => controller.abort(stop));

      let observed: unknown;
      let inflater: ReturnType<typeof createInflater> | undefined;
      let inflaterClosed = false;
      try {
        await testPayloads(fixture.bytes, parsed.entries, payloadContext.context, () => {
          inflater = createInflater();
          inflater.once('close', () => void (inflaterClosed = true));
          return inflater;
        });
      } catch (error) {
        observed = error;
      }
      expect(observed).to.equal(stop);
      expect(payloadContext.yields()).to.eql(1);
      expect(inflater?.destroyed).to.eql(true);
      expect(inflaterClosed).to.eql(true);
    });
  });
});

/** Generate deterministic high-entropy input that resists trivial compression. */
function pseudoRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  let state = 0x6d2b79f5;
  for (let index = 0; index < bytes.byteLength; index++) {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    bytes[index] = state;
  }
  return bytes;
}
