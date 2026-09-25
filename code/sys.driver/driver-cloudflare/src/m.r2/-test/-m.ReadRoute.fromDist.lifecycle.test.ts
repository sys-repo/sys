import { describe, expect, it, Testing, Time, WebFixture } from '../../-test.ts';
import { R2 } from '../mod.ts';
import { fixture } from './u.fixture.fromDist.ts';
import { expectRecovery, origin, request } from './u.fixture.readRoute.ts';

const fromDist = R2.ReadRoute.fromDist;

describe('R2.ReadRoute.fromDist: lifetime', () => {
  for (const stop of ['cancelled', 'timeout'] as const) {
    it(`${stop} → ignores caller listener overrides and owns late body cancellation`, async () => {
      const f = fixture();
      const caller = new AbortController();
      f.args.signal = caller.signal;
      f.args.limits.timeout = stop === 'timeout' ? 30 : 1000;
      const fetchGate = Promise.withResolvers<Response>();
      const cleanup = Promise.withResolvers<void>();
      const cancelledBody = Promise.withResolvers<void>();
      let fetched = 0;
      let cancelled = 0;
      let hooks = 0;
      for (const name of ['addEventListener', 'removeEventListener']) {
        Object.defineProperty(caller.signal, name, {
          get() {
            hooks++;
            throw new Error('listener-SECRET');
          },
        });
      }
      using _fetch = WebFixture.Fetch.mock(() => {
        fetched++;
        return fetchGate.promise;
      });
      const pending = fromDist(f.args);
      try {
        await Testing.until(() => fetched === 1);
        if (stop === 'cancelled') caller.abort('SECRET');
        expect(await pending).to.eql({ kind: stop });
        expect(hooks).to.eql(0);
        fetchGate.resolve(
          new Response(
            new ReadableStream({
              async cancel() {
                cancelled++;
                await cleanup.promise;
                cancelledBody.resolve();
              },
            }),
          ),
        );
        await Testing.until(() => cancelled === 1);
        expect(f.policies).to.eql([]);
        cleanup.resolve();
        await cancelledBody.promise;
        await Time.wait(0);
        expect(f.policies).to.eql([]);
        expect(fetched).to.eql(1);
        expect(hooks).to.eql(0);
      } finally {
        fetchGate.resolve(new Response(null));
        cleanup.resolve();
        caller.abort();
        await pending;
        await Time.wait(0);
      }
    });
  }

  it('timeout during signing → no late fetch or policy', async () => {
    const f = fixture();
    f.args.limits.timeout = 20;
    const signer = Promise.withResolvers<string>();
    const settled = Promise.withResolvers<void>();
    f.args.bucket.presignGet = async () => {
      try {
        return await signer.promise;
      } finally {
        settled.resolve();
      }
    };
    let fetched = 0;
    using _fetch = WebFixture.Fetch.mock(() => {
      fetched++;
      return Promise.resolve(new Response(f.bytes));
    });
    const pending = fromDist(f.args);
    try {
      expect(await pending).to.eql({ kind: 'timeout' });
    } finally {
      signer.resolve(`${origin}/assets/release/dist.json`);
      await settled.promise;
      await pending;
      await Time.wait(0);
    }
    expect(fetched).to.eql(0);
    expect(f.policies).to.eql([]);
  });

  for (const cancel of [false, true]) {
    it(`pending real manifest admission → ${cancel ? 'cancel promptly and observe settlement' : 'read deadline has ended'}`, async () => {
      const f = fixture();
      const caller = new AbortController();
      f.args.signal = caller.signal;
      f.args.limits.timeout = 30;
      const gate = Promise.withResolvers<void>();
      let hashing = false;
      let hashed = false;
      let completed = false;
      const original = crypto.subtle.digest;
      // Delay the actual ignore-rules digest inside Pinned admission, never forge its result.
      crypto.subtle.digest = async function (...args) {
        hashing = true;
        await gate.promise;
        const result = await original.apply(this, args);
        hashed = true;
        return result;
      };
      using _fetch = WebFixture.Fetch.mock(() => Promise.resolve(new Response(f.bytes)));
      const pending = fromDist(f.args).then((result) => {
        completed = true;
        return result;
      });
      try {
        await Testing.until(() => hashing);
        if (cancel) {
          caller.abort('SECRET');
          expect(await pending).to.eql({ kind: 'cancelled' });
          expect(hashed).to.eql(false);
        } else {
          await Time.wait(60);
          expect(completed).to.eql(false);
        }
        gate.resolve();
        const result = await pending;
        expect(result.kind).to.eql(cancel ? 'cancelled' : 'ready');
        await Testing.until(() => hashed);
        await Time.wait(0);
        expect(f.policies.length).to.eql(cancel ? 0 : 1);
      } finally {
        gate.resolve();
        await pending;
        await Testing.until(() => hashed);
        crypto.subtle.digest = original;
      }
    });
  }

  it('abort during policy takes precedence over its return or exception', async () => {
    for (const throws of [false, true]) {
      const f = fixture();
      const caller = new AbortController();
      f.args.signal = caller.signal;
      f.args.routes = () => {
        caller.abort('SECRET');
        if (throws) throw new Error('SECRET');
        return { '/': 'index.html' };
      };
      using _fetch = WebFixture.Fetch.mock(() => Promise.resolve(new Response(f.bytes)));
      expect(await fromDist(f.args)).to.eql({ kind: 'cancelled' });
    }
  });

  it('ready handler owns request cancellation and retains its slot through cleanup', async () => {
    const f = fixture();
    const startup = new AbortController();
    f.args.signal = startup.signal;
    const cleanup = Promise.withResolvers<void>();
    let fetched = 0;
    let reading = false;
    let cancelled = 0;
    using _fetch = WebFixture.Fetch.mock(() => {
      fetched++;
      if (fetched === 1) return Promise.resolve(new Response(f.bytes));
      if (fetched > 2) return Promise.resolve(new Response('ok'));
      return Promise.resolve(
        new Response(
          new ReadableStream<Uint8Array>({
            pull() {
              reading = true;
            },
            cancel() {
              cancelled++;
              return cleanup.promise;
            },
          }),
        ),
      );
    });
    const result = await fromDist(f.args);
    expect(result.kind).to.eql('ready');
    if (result.kind !== 'ready') throw new Error('Expected handler.');
    startup.abort();
    const caller = new AbortController();
    const pending = result.handler(request('/', { signal: caller.signal }));
    try {
      await Testing.until(() => reading);
      caller.abort();
      expect((await pending).status).to.eql(499);
      expect(cancelled).to.eql(1);
      expect((await result.handler(request('/'))).status).to.eql(503);
      cleanup.resolve();
      await expectRecovery(result.handler);
      expect(f.authorized).to.eql(['release/index.html', 'release/index.html']);
    } finally {
      cleanup.resolve();
      caller.abort();
      await pending;
    }
  });
});
