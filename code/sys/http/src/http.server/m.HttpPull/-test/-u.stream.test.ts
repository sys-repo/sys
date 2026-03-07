import { type t, describe, expect, Fs, it, Path, Rx, Testing } from '../../../-test.ts';
import { HttpPull } from '../mod.ts';

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

  it('emits start + done for each URL; done order reflects completion, not input', async () => {
    // Slow/fast endpoints:
    const server = Testing.Http.server((req) => {
      const u = new URL(req.url);
      if (u.pathname.endsWith('/slow.txt')) {
        return new Promise<Response>((resolve) =>
          setTimeout(() => resolve(Testing.Http.text(req, 'SLOW')), 30),
        );
      }
      return Testing.Http.text(req, 'FAST'); // ← /fast.txt
    });

    try {
      const slow = toLocalhost(server.url.join('path', 'sample', 'slow.txt'));
      const fast = toLocalhost(server.url.join('path', 'sample', 'fast.txt'));
      const outDir = await mkTmpDir();

      const stream = HttpPull.stream([slow, fast], outDir, { concurrency: 2 });
      const events: t.HttpPullEvent[] = [];
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
      const a = dones.find((d: any) => d.record.path.source.endsWith('/fast.txt'))!.record;
      const b = dones.find((d: any) => d.record.path.source.endsWith('/slow.txt'))!.record;

      const ta = await Fs.readText(a.path.target);
      const tb = await Fs.readText(b.path.target);
      expect(ta.ok).to.eql(true);
      expect(tb.ok).to.eql(true);
      expect(ta.data).to.eql('FAST');
      expect(tb.data).to.eql('SLOW');

      const result = await stream.done;
      expect(result.ok).to.eql(true);
      expect(result.ops).to.have.length(2);

      const sources = result.ops.map((r) => r.path.source).sort();
      expect(sources[0].endsWith('/fast.txt')).to.eql(true);
      expect(sources[1].endsWith('/slow.txt')).to.eql(true);
    } finally {
      await server.dispose();
    }
  });

  it('emits start + error on HTTP 404; no file is written', async () => {
    const server = Testing.Http.server(() => Testing.Http.error(404, 'NF'));
    const url = toLocalhost(server.url.join('path', 'sample', 'missing.txt'));
    const outDir = await mkTmpDir();

    const stream = HttpPull.stream([url], outDir);

    const events: t.HttpPullEvent[] = [];
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

    const events: t.HttpPullEvent[] = [];
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

  it('cancels via `until` (no done/error)', async () => {
    // Server that never responds; requests hang until aborted.
    const server = Testing.Http.server((_req) => new Promise<Response>(() => {}));
    const a = toLocalhost(server.url.join('x', 'a.txt'));
    const b = toLocalhost(server.url.join('x', 'b.txt'));
    const outDir = await mkTmpDir();

    const until = Rx.disposable();
    const events: t.HttpPullEvent[] = [];

    const stream = HttpPull.stream([a, b], outDir, { until, concurrency: 2 });
    queueMicrotask(() => until.dispose()); // ← cancel immediately on next microtask.

    for await (const ev of stream) events.push(ev);

    // Cancellation is quiet: no 'done' and no 'error'
    expect(events.some((e) => e.kind === 'done')).to.eql(false);
    expect(events.some((e) => e.kind === 'error')).to.eql(false);

    const result = await stream.done;
    expect(result.ok).to.eql(true); // empty ops → trivially true
    expect(result.ops).to.have.length(0);

    await server.dispose();
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

        const events: t.HttpPullEvent[] = [];
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

        const events: t.HttpPullEvent[] = [];
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

      const events: t.HttpPullEvent[] = [];
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
      expect(starts.length).to.be.gte(0).and.lte(2);

      const result = await stream.done;
      expect(result.ok).to.eql(true);
      expect(result.ops).to.have.length(2);

      await server.dispose();
    });

    it('cancel(reason) → completes observable quietly (no done/error)', async () => {
      // Never-responding server; stream should end quietly on cancel.
      const server = Testing.Http.server((_req) => new Promise<Response>(() => {}));
      const a = toLocalhost(server.url.join('x', 'a.txt'));
      const b = toLocalhost(server.url.join('x', 'b.txt'));
      const outDir = await mkTmpDir();

      const stream = HttpPull.stream([a, b], outDir, { concurrency: 2 });

      const events: t.HttpPullEvent[] = [];
      const done = deferred();
      const sub = stream.events().$.subscribe({
        next: (e) => events.push(e),
        error: done.reject,
        complete: done.resolve,
      });

      // Cancel on next microtask.
      queueMicrotask(() => stream.cancel('react:unmount'));

      await done.promise;
      sub.unsubscribe();

      expect(events.some((e) => e.kind === 'done')).to.eql(false);
      expect(events.some((e) => e.kind === 'error')).to.eql(false);

      const result = await stream.done;
      expect(result.ok).to.eql(true);
      expect(result.ops).to.have.length(0);

      await server.dispose();
    });

    it('events(until) has independent lifetime from iterator (observable completes; iterator continues)', async () => {
      const server = Testing.Http.server((req) => Testing.Http.text(req, 'OK'));
      const a = toLocalhost(server.url.join('p', 'a.txt'));
      const b = toLocalhost(server.url.join('p', 'b.txt'));
      const outDir = await mkTmpDir();

      const stream = HttpPull.stream([a, b], outDir, { concurrency: 2 });

      // Start a for-await consumer that should finish naturally.
      const iterEvents: t.HttpPullEvent[] = [];
      const iterDone = deferred<void>();
      (async () => {
        for await (const ev of stream) iterEvents.push(ev);
        iterDone.resolve();
      })();

      // Create an events() subscription with its own until; we dispose it immediately.
      const local = Rx.disposable();
      const obsEvents: t.HttpPullEvent[] = []; // ← was HttpPullRecord[]
      const obsDone = deferred<void>();
      const sub = stream.events(local).$.subscribe({
        next: (e) => obsEvents.push(e),
        error: obsDone.reject,
        complete: obsDone.resolve,
      });

      // End only the observable view.
      local.dispose('local:unsubscribe');

      await obsDone.promise;
      sub.unsubscribe();

      // Observable ended early; iterator should still complete and see all events.
      await iterDone.promise;

      const iterStarts = iterEvents.filter((e) => e.kind === 'start').length;
      const iterDones = iterEvents.filter((e) => e.kind === 'done').length;

      expect(obsEvents.length).to.be.gte(0); // may be 0 or a few 'start' depending on timing
      expect(iterStarts).to.eql(2);
      expect(iterDones).to.eql(2);

      const result = await stream.done;
      expect(result.ok).to.eql(true);
      expect(result.ops).to.have.length(2);

      await server.dispose();
    });
  });
});
