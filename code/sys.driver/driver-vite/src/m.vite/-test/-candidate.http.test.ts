import { describe, expect, it, Time, Try, WebFixture } from '../../-test.ts';
import { CANDIDATE_TIMEOUT, requestCandidate } from '../-test.external/u.fixture.candidate.http.ts';

const BASE = 'http://127.0.0.1:12345/';

describe('Vite candidate HTTP proof', () => {
  it('consumes the response body and preserves HTTP evidence without retrying', async () => {
    for (const status of [200, 500]) {
      let calls = 0;
      using _fetch = WebFixture.Fetch.mock(() => {
        calls++;
        return Promise.resolve(
          new Response('module evidence', {
            status,
            headers: { 'content-type': 'text/javascript' },
          }),
        );
      });
      const response = await requestCandidate(BASE, 'main.tsx');
      expect(response).to.eql({ status, contentType: 'text/javascript', text: 'module evidence' });
      expect(calls).to.eql(1);
    }
  });

  it('spent startup budget → fails before issuing a request', async () => {
    let calls = 0;
    using _fetch = WebFixture.Fetch.mock(() => {
      calls++;
      return Promise.resolve(new Response('too late'));
    });
    const { result } = await Try.run(() => requestCandidate(BASE, 'main.tsx', 0));
    expect(result.ok).to.eql(false);
    expect(calls).to.eql(0);
  });

  it('slow cold response is allowed; expired budgets fail even when the timer runs late', async () => {
    const cases = [
      { elapsed: 62_950, timeout: CANDIDATE_TIMEOUT.startup, ok: true },
      { elapsed: CANDIDATE_TIMEOUT.startup, timeout: CANDIDATE_TIMEOUT.startup, ok: false },
      { elapsed: CANDIDATE_TIMEOUT.request, timeout: undefined, ok: false },
    ];
    for (const test of cases) {
      let now = 0;
      using _clock = WebFixture.Property.mock([{
        target: performance,
        key: 'now',
        descriptor: { configurable: true, value: () => now },
      }]);
      using _fetch = WebFixture.Fetch.mock(() => {
        // Model elapsed compilation/body work without a minute-long test or timer-order race.
        now = test.elapsed;
        return Promise.resolve(new Response('export const ready = true;'));
      });
      const { result } = await Try.run(() => requestCandidate(BASE, 'main.tsx', test.timeout));
      expect(result.ok).to.eql(test.ok);
      if (!result.ok) expect(result.error.cause).to.have.property('name', 'TimeoutError');
    }
  });

  it('stalled headers → bounded failure with URL, stage and original cause', async () => {
    let calls = 0;
    let signal: AbortSignal | undefined;
    using _fetch = WebFixture.Fetch.mock((_url, init) => {
      calls++;
      signal = init?.signal ?? undefined;
      return new Promise<Response>((_resolve, reject) => {
        signal?.addEventListener('abort', () => reject(signal?.reason), { once: true });
      });
    });
    const { result } = await Time.waitFor(
      () => Try.run(() => requestCandidate(BASE, 'main.tsx', 20)),
      { timeout: 1_000 },
    );
    expect(result.ok).to.eql(false);
    if (result.ok) return;
    expect(result.error.message).to.include(`${BASE}main.tsx`);
    expect(result.error.message).to.include('awaiting headers');
    expect(result.error.message).to.include('deadline 20ms');
    expect(result.error.cause).to.equal(signal?.reason);
    expect(signal?.aborted).to.eql(true);
    expect(calls).to.eql(1);
  });

  it('headers followed by a stalled body → the same deadline still aborts', async () => {
    let signal: AbortSignal | undefined;
    using _fetch = WebFixture.Fetch.mock((_url, init) => {
      signal = init?.signal ?? undefined;
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('partial module'));
          signal?.addEventListener('abort', () => controller.error(signal?.reason), { once: true });
        },
      });
      return Promise.resolve(
        new Response(body, { headers: { 'content-type': 'text/javascript' } }),
      );
    });
    const { result } = await Time.waitFor(
      () => Try.run(() => requestCandidate(BASE, 'main.tsx', 20)),
      { timeout: 1_000 },
    );
    expect(result.ok).to.eql(false);
    if (result.ok) return;
    expect(result.error.message).to.include('reading body');
    expect(result.error.cause).to.equal(signal?.reason);
    expect(signal?.aborted).to.eql(true);
  });

  it('transport failure → preserves cause and fails on the first attempt', async () => {
    const cause = new Error('connection reset');
    let calls = 0;
    using _fetch = WebFixture.Fetch.mock(() => {
      calls++;
      return Promise.reject(cause);
    });
    const { result } = await Try.run(() => requestCandidate(BASE, 'main.tsx'));
    expect(result.ok).to.eql(false);
    if (result.ok) return;
    expect(result.error.cause).to.equal(cause);
    expect(calls).to.eql(1);
  });
});
