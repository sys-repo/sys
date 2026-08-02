import { describe, expect, Fs, it, Path, Rx, type t, Testing, Time } from '../../../-test.ts';
import { Http } from '../../../http.client/mod.ts';
import { HttpPull as HttpPullRaw } from '../mod.ts';
import { createExecutor } from '../u/u.execute.ts';
import { options as transport, responsePolicy } from './u.fixture.ts';

type PullOptions = Omit<t.HttpPull.Options, 'client' | 'policy'>;
const HttpPull = {
  ...HttpPullRaw,
  stream(urls: readonly t.StringUrl[], dir: t.StringDir, options: PullOptions = {}) {
    return HttpPullRaw.stream(urls, dir, transport(urls, options));
  },
};

describe('HttpPull.stream', () => {
  const mkTmpDir = async () => (await Fs.makeTempDir({ prefix: 'http-pull-' })).absolute;
  const deferred = <T = void>() => {
    let resolve!: (v: T) => void, reject!: (e: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };

  /**
   * CI can expose servers as "http://0.0.0.0:<port>/..." which is a listen address,
   * not a reliable client target. Normalize such URLs to "127.0.0.1".
   */
  const toLocalhost = (input: string) => {
    try {
      const u = new URL(input);
      if (u.hostname === '0.0.0.0') u.hostname = '127.0.0.1';
      return u.toString();
    } catch {
      return input.replace('://0.0.0.0:', '://127.0.0.1:');
    }
  };

  const clientView = (
    base: t.HttpFetch.Instance,
    options: {
      readonly blob?: t.HttpFetch.Instance['blob'];
      readonly onDispose?: () => void;
    } = {},
  ): t.HttpFetch.Instance => {
    const client = Object.create(base) as t.HttpFetch.Instance;
    if (options.blob) Object.defineProperty(client, 'blob', { value: options.blob });
    Object.defineProperty(client, 'dispose', {
      value(reason?: unknown) {
        options.onDispose?.();
        base.dispose(reason);
      },
    });
    return client;
  };

  const pendingServer = () => {
    let release!: () => void;
    const released = new Promise<void>((resolve) => release = resolve);
    const server = Testing.Http.server(async (request) => {
      await released;
      return Testing.Http.text(request, 'late');
    });
    return { server, release };
  };

  it('emits start + done for each URL; done order reflects completion, not input', async () => {
    // Slow/fast endpoints:
    const server = Testing.Http.server((req) => {
      const u = new URL(req.url);
      if (u.pathname.endsWith('/slow.txt')) {
        return new Promise<Response>((resolve) =>
          Time.delay(30, () => resolve(Testing.Http.text(req, 'SLOW')))
        );
      }
      return Testing.Http.text(req, 'FAST'); // ← /fast.txt
    });

    try {
      const slow = toLocalhost(server.url.join('path', 'sample', 'slow.txt'));
      const fast = toLocalhost(server.url.join('path', 'sample', 'fast.txt'));
      const outDir = await mkTmpDir();

      const stream = HttpPull.stream([slow, fast], outDir, { concurrency: 2 });
      const events: t.HttpPull.Event.Any[] = [];
      for await (const ev of stream) {
        events.push(ev);
      }

      // Counts:
      const starts = events.filter((e) => e.kind === 'start');
      const dones = events.filter((e) => e.kind === 'done');
      const errors = events.filter((e) => e.kind === 'error');

      expect(starts).to.have.length(2);
      expect(dones).to.have.length(2);
      expect(errors).to.have.length(0);

      // Emission order: fast should finish before slow:
      const firstDone = dones[0];
      expect(firstDone.record.ok).to.eql(true);
      expect(firstDone.record.path.source.endsWith('/fast.txt')).to.eql(true);

      // Files are written:
      const a = dones.find((event) => event.record.path.source.endsWith('/fast.txt'))!.record;
      const b = dones.find((event) => event.record.path.source.endsWith('/slow.txt'))!.record;

      const ta = await Fs.readText(a.path.target);
      const tb = await Fs.readText(b.path.target);
      expect(ta.ok).to.eql(true);
      expect(tb.ok).to.eql(true);
      expect(ta.data).to.eql('FAST');
      expect(tb.data).to.eql('SLOW');

      const result = await stream.done;
      expect(result.ok).to.eql(true);
      expect(result.ops).to.have.length(2);

      expect(result.ops.map((record) => record.path.source)).to.eql([slow, fast]);
    } finally {
      await server.dispose();
    }
  });

  it('emits start + error on HTTP 404; no file is written', async () => {
    const server = Testing.Http.server(() => Testing.Http.error(404, 'NF'));
    const url = toLocalhost(server.url.join('path', 'sample', 'missing.txt'));
    const outDir = await mkTmpDir();

    const stream = HttpPull.stream([url], outDir);

    const events: t.HttpPull.Event.Any[] = [];
    for await (const ev of stream) events.push(ev);

    const starts = events.filter((e) => e.kind === 'start');
    const errs = events.filter((e) => e.kind === 'error');

    expect(starts).to.have.length(1);
    expect(errs).to.have.length(1);

    const err = errs[0].record;
    expect(err.ok).to.eql(false);
    expect(err.status).to.eql(404);
    expect(await Fs.exists(err.path.target)).to.eql(false);

    const result = await stream.done;
    expect(result.ok).to.eql(false);
    expect(result.ops).to.have.length(1);

    const op = result.ops[0];
    expect(op.ok).to.eql(false);
    expect(op.status).to.eql(404);
    expect(await Fs.exists(op.path.target)).to.eql(false);

    await server.dispose();
  });

  it('invalid URL → start then error; sanitized target; no write', async () => {
    const outDir = await mkTmpDir();
    const bad = '::::bad::::';

    const stream = HttpPull.stream([bad], outDir);

    const events: t.HttpPull.Event.Any[] = [];
    for await (const ev of stream) events.push(ev);

    const starts = events.filter((e) => e.kind === 'start');
    const errs = events.filter((e) => e.kind === 'error');

    expect(starts).to.have.length(1);
    expect(errs).to.have.length(1);

    const rec = errs[0].record;
    expect(rec.ok).to.eql(false);
    expect(rec.error).to.eql('Invalid URL');

    // Basename is sanitized; absolute path will contain '/', so check just the filename:
    const base = Path.basename(rec.path.target);
    expect(base.includes('/')).to.eql(false);
    expect(await Fs.exists(rec.path.target)).to.eql(false);

    const result = await stream.done;
    expect(result.ok).to.eql(false);
    expect(result.ops).to.have.length(1);

    const op = result.ops[0];
    expect(op.ok).to.eql(false);
    expect(op.error).to.eql('Invalid URL');
    expect(await Fs.exists(op.path.target)).to.eql(false);
  });

  it('records every queued and in-flight input cancelled via `until`', async () => {
    const pending = pendingServer();
    const { server } = pending;
    try {
      const a = toLocalhost(server.url.join('x', 'a.txt'));
      const b = toLocalhost(server.url.join('x', 'b.txt'));
      const outDir = await mkTmpDir();
      const until = Rx.disposable();
      const events: t.HttpPull.Event.Any[] = [];
      const stream = HttpPull.stream([a, b], outDir, { until, concurrency: 2 });

      queueMicrotask(() => until.dispose());
      for await (const event of stream) events.push(event);

      expect(events.some((event) => event.kind === 'done')).to.eql(false);
      expect(events.filter((event) => event.kind === 'error')).to.have.length(2);

      const result = await stream.done;
      expect(result.ok).to.eql(false);
      expect(result.ops).to.have.length(2);
      expect(result.ops.map((record) => record.path.source)).to.eql([a, b]);
      expect(
        result.ops.every((record) =>
          !record.ok && record.cancelled === true && record.status === 499
        ),
      ).to.eql(true);
    } finally {
      pending.release();
      await server.dispose();
    }
  });

  it('honors a pre-aborted lifecycle before creating owned transport', async () => {
    const a = 'https://example.test/a.txt';
    const b = 'https://example.test/b.txt';
    const outDir = await mkTmpDir();
    const until = new AbortController();
    let clientCreations = 0;
    const executor = createExecutor(() => {
      clientCreations++;
      throw new Error('Unexpected client creation');
    });
    until.abort('test:pre-aborted');

    const result = await executor([a, b], outDir, {
      policy: responsePolicy([a, b]),
      until: until.signal,
    }).done;

    expect(clientCreations).to.eql(0);
    expect(result.ok).to.eql(false);
    expect(result.ops).to.have.length(2);
    expect(result.ops.every((record) => !record.ok && record.cancelled === true)).to.eql(true);
  });

  it('bounds retained events when no consumer is attached', async () => {
    const urls = Array.from({ length: 300 }, (_, index) => `::::bad-${index}::::`);
    const outDir = await mkTmpDir();
    const stream = HttpPull.stream(urls, outDir, { concurrency: 32 });

    const result = await stream.done;
    expect(result.ok).to.eql(false);
    expect(result.ops).to.have.length(urls.length);
    expect(result.ops.map((record) => record.path.source)).to.eql(urls);

    const retained: t.HttpPull.Event.Any[] = [];
    for await (const event of stream) retained.push(event);
    expect(retained.length).to.be.gte(1).and.lte(256);
  });

  it('early iterator return cancels queued/in-flight work and awaits quiescence', async () => {
    const a = 'https://example.test/a.txt';
    const b = 'https://example.test/b.txt';
    const outDir = await mkTmpDir();
    const entered = deferred<void>();
    let active = 0;

    const base = Http.Fetch.make({ policy: responsePolicy([a, b]) });
    const blob: t.HttpFetch.Instance['blob'] = (_input, init = {}) =>
      new Promise((_resolve, reject) => {
        active++;
        entered.resolve();
        const abort = () => {
          Time.delay(20, () => {
            active--;
            reject(new DOMException('Aborted', 'AbortError'));
          });
        };
        if (init.signal?.aborted) abort();
        else init.signal?.addEventListener('abort', abort, { once: true });
      });
    const client = clientView(base, { blob });
    const stream = HttpPullRaw.stream([a, b], outDir, { client, concurrency: 1 });
    const observed: t.HttpPull.Event.Any[] = [];
    const view = stream.events();
    const subscription = view.$.subscribe((event) => observed.push(event));
    const iterator = stream[Symbol.asyncIterator]();

    const first = await iterator.next();
    expect(first.value?.kind).to.eql('start');
    await entered.promise;
    await iterator.return?.();

    const result = await stream.done;
    const eventsAtDone = observed.length;
    expect(active).to.eql(0);
    expect(result.ok).to.eql(false);
    expect(result.ops).to.have.length(2);
    expect(result.ops.map((record) => record.path.source)).to.eql([a, b]);
    expect(result.ops.every((record) => !record.ok && record.cancelled === true)).to.eql(true);
    expect(await Fs.exists(result.ops[0].path.target)).to.eql(false);
    expect(await Fs.exists(result.ops[1].path.target)).to.eql(false);

    await Time.wait(30);
    expect(observed.length).to.eql(eventsAtDone);
    subscription.unsubscribe();
    view.dispose();
    client.dispose('test:complete');
  });

  it('disposes owned clients exactly once and leaves injected clients caller-owned', async () => {
    const server = Testing.Http.server((req) => Testing.Http.text(req, 'owned'));
    let injected: t.HttpFetch.Instance | undefined;
    try {
      const url = toLocalhost(server.url.join('client.txt'));
      const policy = responsePolicy([url]);
      let owned: t.HttpFetch.Instance | undefined;
      let ownedDisposals = 0;
      const executor = createExecutor((createOptions) => {
        const base = Http.Fetch.make(createOptions);
        owned = clientView(base, { onDispose: () => ownedDisposals++ });
        return owned;
      });

      const ownedDir = await mkTmpDir();
      const ownedResult = await executor([url], ownedDir, { policy }).done;
      expect(ownedResult.ok).to.eql(true);
      expect(ownedDisposals).to.eql(1);
      expect(owned?.disposed).to.eql(true);

      let injectedDisposals = 0;
      injected = clientView(Http.Fetch.make({ policy }), {
        onDispose: () => injectedDisposals++,
      });
      const injectedDir = await mkTmpDir();
      const injectedResult = await HttpPullRaw.stream([url], injectedDir, { client: injected })
        .done;
      expect(injectedResult.ok).to.eql(true);
      expect(injectedDisposals).to.eql(0);
      expect(injected.disposed).to.eql(false);

      injected.dispose('caller:complete');
      expect(injectedDisposals).to.eql(1);
      expect(injected.disposed).to.eql(true);
    } finally {
      if (injected && !injected.disposed) injected.dispose('test:cleanup');
      await server.dispose();
    }
  });

  describe('retry', () => {
    it('retries on transient HTTP 503 and eventually succeeds', async () => {
      let count = 0;

      // Server: first request → 503, second → 200 OK.
      const server = Testing.Http.server((req) => {
        count++;
        if (count === 1) {
          return Testing.Http.error(503, 'TEMP');
        }
        return Testing.Http.text(req, 'OK');
      });

      try {
        const url = toLocalhost(server.url.join('p', 'file.txt'));
        const outDir = await mkTmpDir();

        const stream = HttpPull.stream([url], outDir);

        const events: t.HttpPull.Event.Any[] = [];
        for await (const ev of stream) events.push(ev);

        const starts = events.filter((e) => e.kind === 'start');
        const dones = events.filter((e) => e.kind === 'done');
        const errors = events.filter((e) => e.kind === 'error');

        // No terminal error; done event present.
        expect(starts).to.have.length(1);
        expect(errors).to.have.length(0);
        expect(dones).to.have.length(1);

        const record = dones[0].record;
        expect(record.ok).to.eql(true);

        const text = await Fs.readText(record.path.target);
        expect(text.ok).to.eql(true);
        expect(text.data).to.eql('OK');

        const result = await stream.done;
        expect(result.ok).to.eql(true);
        expect(result.ops).to.have.length(1);

        const op = result.ops[0];
        expect(op.ok).to.eql(true);
        expect(op.status).to.eql(200);
        expect(await Fs.exists(op.path.target)).to.eql(true);
      } finally {
        await server.dispose();
      }
    });

    it('fails after max retries on repeated 503', async () => {
      // Always fail with 503.
      const server = Testing.Http.server(() => Testing.Http.error(503, 'TEMP'));

      try {
        const url = toLocalhost(server.url.join('p', 'never.txt'));
        const outDir = await mkTmpDir();

        const stream = HttpPull.stream([url], outDir);

        const events: t.HttpPull.Event.Any[] = [];
        for await (const ev of stream) events.push(ev);

        const starts = events.filter((e) => e.kind === 'start');
        const dones = events.filter((e) => e.kind === 'done');
        const errors = events.filter((e) => e.kind === 'error');

        expect(starts).to.have.length(1);
        expect(dones).to.have.length(0);
        expect(errors).to.have.length(1);

        const rec = errors[0].record;
        expect(rec.ok).to.eql(false);
        expect(rec.status).to.eql(503);

        // Should not write a file.
        expect(await Fs.exists(rec.path.target)).to.eql(false);

        const result = await stream.done;
        expect(result.ok).to.eql(false);
        expect(result.ops).to.have.length(1);

        const op = result.ops[0];
        expect(op.ok).to.eql(false);
        expect(op.status).to.eql(503);
        expect(await Fs.exists(op.path.target)).to.eql(false);
      } finally {
        await server.dispose();
      }
    });
  });

  describe('stream.events() - observable', () => {
    it('emits start/done and completes (observable)', async () => {
      // Keep server simple; start events may be missed by late subscription.
      const server = Testing.Http.server((req) => Testing.Http.text(req, 'OK'));
      const a = toLocalhost(server.url.join('p', 'a.txt'));
      const b = toLocalhost(server.url.join('p', 'b.txt'));
      const outDir = await mkTmpDir();

      const stream = HttpPull.stream([a, b], outDir, { concurrency: 2 });

      const events: t.HttpPull.Event.Any[] = [];
      const done = deferred();

      const sub = stream.events().$.subscribe({
        next: (e) => events.push(e),
        error: done.reject,
        complete: done.resolve,
      });

      await done.promise;
      sub.unsubscribe();

      const starts = events.filter((e) => e.kind === 'start');
      const dones = events.filter((e) => e.kind === 'done');
      const errors = events.filter((e) => e.kind === 'error');

      // Deterministic invariants for a hot Subject:
      expect(dones.length).to.eql(2);
      expect(errors.length).to.eql(0);
      expect(starts.length).to.be.lte(2);

      const result = await stream.done;
      expect(result.ok).to.eql(true);
      expect(result.ops).to.have.length(2);

      await server.dispose();
    });

    it('cancel(reason) emits terminal cancellation records, then completes', async () => {
      const pending = pendingServer();
      const { server } = pending;
      try {
        const a = toLocalhost(server.url.join('x', 'a.txt'));
        const b = toLocalhost(server.url.join('x', 'b.txt'));
        const outDir = await mkTmpDir();
        const stream = HttpPull.stream([a, b], outDir, { concurrency: 2 });
        const events: t.HttpPull.Event.Any[] = [];
        const done = deferred();
        const sub = stream.events().$.subscribe({
          next: (event) => events.push(event),
          error: done.reject,
          complete: done.resolve,
        });

        queueMicrotask(() => stream.cancel('react:unmount'));
        await done.promise;
        sub.unsubscribe();

        expect(events.some((event) => event.kind === 'done')).to.eql(false);
        expect(events.filter((event) => event.kind === 'error')).to.have.length(2);

        const result = await stream.done;
        expect(result.ok).to.eql(false);
        expect(result.ops).to.have.length(2);
        expect(result.ops.every((record) => !record.ok && record.cancelled === true)).to.eql(
          true,
        );
      } finally {
        pending.release();
        await server.dispose();
      }
    });

    it('isolates one disposed observable view from its sibling and iterator', async () => {
      const server = Testing.Http.server((req) => Testing.Http.text(req, 'OK'));
      const a = toLocalhost(server.url.join('p', 'a.txt'));
      const b = toLocalhost(server.url.join('p', 'b.txt'));
      const outDir = await mkTmpDir();

      const stream = HttpPull.stream([a, b], outDir, { concurrency: 2 });

      // Start a for-await consumer that should finish naturally.
      const iterEvents: t.HttpPull.Event.Any[] = [];
      const iterDone = deferred<void>();
      (async () => {
        for await (const ev of stream) iterEvents.push(ev);
        iterDone.resolve();
      })();

      // Create sibling views, then end only the first view.
      const local = Rx.disposable();
      const localDone = deferred<void>();
      const localView = stream.events(local);
      const localSub = localView.$.subscribe({
        error: localDone.reject,
        complete: localDone.resolve,
      });
      const siblingEvents: t.HttpPull.Event.Any[] = [];
      const siblingDone = deferred<void>();
      const siblingView = stream.events();
      const siblingSub = siblingView.$.subscribe({
        next: (event) => siblingEvents.push(event),
        error: siblingDone.reject,
        complete: siblingDone.resolve,
      });

      local.dispose('local:unsubscribe');
      await localDone.promise;
      localSub.unsubscribe();

      // The sibling view and iterator continue to the operation's natural completion.
      await Promise.all([iterDone.promise, siblingDone.promise]);
      siblingSub.unsubscribe();

      const iterStarts = iterEvents.filter((event) => event.kind === 'start').length;
      const iterDones = iterEvents.filter((event) => event.kind === 'done').length;
      const siblingDones = siblingEvents.filter((event) => event.kind === 'done').length;

      expect(localView.disposed).to.eql(true);
      expect(siblingView.disposed).to.eql(true);
      expect(iterStarts).to.eql(2);
      expect(iterDones).to.eql(2);
      expect(siblingDones).to.eql(2);

      const result = await stream.done;
      expect(result.ok).to.eql(true);
      expect(result.ops).to.have.length(2);

      await server.dispose();
    });
  });
});
