import { describe, expect, it, Time } from '../../-test.ts';
import { waitForIndex as poll } from '../-test.external/u.serve.waitFor.ts';

describe('Cached index polling response ownership', () => {
  it('false response is cancelled; successful response is fully consumed before request abort', async () => {
    let cancelled = 0;
    let calls = 0;
    const signals: (AbortSignal | null | undefined)[] = [];
    const body = new ReadableStream({
      cancel() {
        cancelled++;
      },
    });
    const unavailable = new Response(body, { status: 503 });
    const available = new Response(new Uint8Array([1, 2, 3]));
    const request: typeof fetch = (_input, options) => {
      signals.push(options?.signal);
      return Promise.resolve(++calls === 1 ? unavailable : available);
    };
    const bytes = await poll('http://localhost/owned-fixture', 1000, request);
    expect(bytes).to.eql(new Uint8Array([1, 2, 3]));
    expect(calls).to.eql(2);
    expect(cancelled).to.eql(1);
    expect(available.bodyUsed).to.eql(true);
    expect(signals.every((signal) => signal?.aborted)).to.eql(true);
  });

  for (const status of [200, 503]) {
    it(`timeout before a late ${status} response → caller aborts request and cancels late body`, async () => {
      await using cleanup = new AsyncDisposableStack();
      const pending = Promise.withResolvers<Response>();
      let signal: AbortSignal | null | undefined;
      let cancelled = 0;
      let calls = 0;
      const body = new ReadableStream({
        cancel() {
          cancelled++;
        },
      });
      const response = new Response(body, { status });
      const request: typeof fetch = (_input, options) => {
        signal = options?.signal;
        calls++;
        return pending.promise;
      };
      const result = observe(poll('http://localhost/owned-fixture', 20, request));
      cleanup.defer(async () => {
        pending.resolve(response);
        await result;
        await Time.wait(0);
      });
      expect(await result).to.have.property('message', 'Time.waitFor: timeout exceeded');
      expect(signal?.aborted).to.eql(true);
      expect(cancelled).to.eql(0);
      // Deliver the response to the predicate only after proving caller-owned request abort.
      pending.resolve(response);
      await Time.wait(0);
      expect(cancelled).to.eql(1);
      expect(calls).to.eql(1);
    });
  }

  it('timeout during body consumption → caller abort reaches the active request', async () => {
    let signal: AbortSignal | null | undefined;
    let bodyAbort = 0;
    let calls = 0;
    const request: typeof fetch = (_input, options) => {
      signal = options?.signal;
      calls++;
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          signal?.addEventListener('abort', () => {
            bodyAbort++;
            controller.error(signal?.reason);
          }, { once: true });
        },
      });
      return Promise.resolve(new Response(body));
    };
    expect(await observe(poll('http://localhost/owned-fixture', 20, request)))
      .to.have.property('message', 'Time.waitFor: timeout exceeded');
    expect(signal?.aborted).to.eql(true);
    expect(bodyAbort).to.eql(1);
    expect(calls).to.eql(1);
    await Time.wait(0); // Drain the rejected body read and its caller-owned cleanup.
  });
});

async function observe(promise: Promise<Uint8Array>): Promise<unknown> {
  try {
    return await promise;
  } catch (error) {
    return error;
  }
}
