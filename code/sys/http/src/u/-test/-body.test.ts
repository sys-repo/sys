import { describe, expect, it } from '../../-test.ts';
import { Schedule, Try } from '../../common.ts';
import { readBytes } from '../u.body.ts';
import { createHttpOperation } from '../u.operation.ts';

const overflow = () => {
  throw new Error('Unexpected byte overflow.');
};

describe('HTTP bounded byte reader', () => {
  it('completes an absent body with zero bytes and no chunk notifications', async () => {
    using operation = createOperation();
    const events: string[] = [];
    const bytes = await readBytes({
      body: null,
      operation,
      maxBytes: 1,
      overflow,
      onChunk: (loaded) => events.push(`chunk:${loaded}`),
      onComplete: (loaded) => events.push(`complete:${loaded}`),
    });
    expect(bytes).to.eql(new Uint8Array());
    expect(events).to.eql(['complete:0']);
  });

  it('copies reused chunk storage, skips empty chunks, and completes before releasing the lock', async () => {
    using operation = createOperation();
    const storage = new Uint8Array(2);
    const events: string[] = [];
    let pulls = 0;
    const body = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulls++;
        if (pulls === 1) return controller.enqueue(new Uint8Array());
        if (pulls > 3) return controller.close();
        storage.fill(pulls);
        controller.enqueue(storage);
      },
    }, { highWaterMark: 0 });
    const bytes = await readBytes({
      body,
      operation,
      maxBytes: 4,
      overflow,
      onChunk: (loaded) => events.push(`chunk:${loaded}`),
      onComplete(loaded) {
        expect(body.locked).to.eql(true);
        events.push(`complete:${loaded}`);
      },
    });
    storage.fill(9);
    expect(bytes).to.eql(new Uint8Array([2, 2, 3, 3]));
    expect(events).to.eql(['chunk:2', 'chunk:4', 'complete:4']);
    expect(body.locked).to.eql(false);
  });

  it('notifies EOF and releases the reader before a subsequently queued abort', async () => {
    const controller = new AbortController();
    using operation = createOperation(controller.signal);
    const events: string[] = [];
    const failure = new Error('completion failed');
    const body = new ReadableStream<Uint8Array>({
      pull(stream) {
        stream.close();
        // The second job runs after the read continuation, before an extra async return.
        Schedule.micro(() => {
          Schedule.micro(() => {
            events.push(`abort:locked=${body.locked}`);
            controller.abort();
          });
        });
      },
    }, { highWaterMark: 0 });
    const { result } = await Try.run(() => {
      return readBytes({
        body,
        operation,
        maxBytes: 1,
        overflow,
        onComplete() {
          events.push(`complete:aborted=${controller.signal.aborted}`);
          throw failure;
        },
      });
    });
    expect(result.ok).to.eql(false);
    expect(result.error).to.equal(failure);
    expect(events).to.eql(['complete:aborted=false', 'abort:locked=false']);
    expect(body.locked).to.eql(false);
  });

  it('chunk callback failure → cancels the open source and releases the reader', async () => {
    using operation = createOperation();
    const failure = new Error('callback failed');
    let cancelled = 0;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1]));
      },
      cancel() {
        cancelled++;
      },
    });
    const { result } = await Try.run(() => {
      return readBytes({
        body,
        operation,
        maxBytes: 1,
        overflow,
        onChunk() {
          throw failure;
        },
      });
    });
    expect(result.ok).to.eql(false);
    expect(result.error).to.equal(failure);
    expect(body.locked).to.eql(false);
    expect(cancelled).to.eql(1);
  });

  it('completion callback failure → releases the reader without cancelling a closed source', async () => {
    using operation = createOperation();
    const failure = new Error('callback failed');
    let cancelled = 0;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new Uint8Array([1]));
        controller.close();
      },
      cancel() {
        cancelled++;
      },
    });
    const { result } = await Try.run(() => {
      return readBytes({
        body,
        operation,
        maxBytes: 1,
        overflow,
        onComplete() {
          throw failure;
        },
      });
    });
    expect(result.ok).to.eql(false);
    expect(result.error).to.equal(failure);
    expect(body.locked).to.eql(false);
    expect(cancelled).to.eql(0);
  });
});

/**
 * Helpers:
 */
function createOperation(signal = new AbortController().signal) {
  return createHttpOperation(signal, 1_000, {
    cancelled: 'cancelled',
    timeout: 'timeout',
  });
}
