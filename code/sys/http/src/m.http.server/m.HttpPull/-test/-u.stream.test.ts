import { type t, describe, expect, Fs, it, Path, rx, Testing } from '../../../-test.ts';
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
      const slow = server.url.join('path', 'sample', 'slow.txt');
      const fast = server.url.join('path', 'sample', 'fast.txt');
      const outDir = await mkTmpDir();

      const events: any[] = [];
      for await (const ev of HttpPull.stream([slow, fast], outDir, { concurrency: 2 })) {
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
    } finally {
      await server.dispose();
    }
  });

  it('emits start + error on HTTP 404; no file is written', async () => {
    const server = Testing.Http.server(() => Testing.Http.error(404, 'NF'));
    const url = server.url.join('path', 'sample', 'missing.txt');
    const outDir = await mkTmpDir();

    const events: any[] = [];
    for await (const ev of HttpPull.stream([url], outDir)) events.push(ev);

    const starts = events.filter((e) => e.kind === 'start');
    const errs = events.filter((e) => e.kind === 'error');

    expect(starts).to.have.length(1);
    expect(errs).to.have.length(1);

    const err = errs[0].record;
    expect(err.ok).to.eql(false);
    expect(err.status).to.eql(404);
    expect(await Fs.exists(err.path.target)).to.eql(false);

    await server.dispose();
  });

  it('invalid URL → start then error; sanitized target; no write', async () => {
    const outDir = await mkTmpDir();
    const bad = '::::bad::::';

    const events: any[] = [];
    for await (const ev of HttpPull.stream([bad], outDir)) events.push(ev);

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
  });

  it('cancels via `until` (no done/error)', async () => {
    // Server that never responds; requests hang until aborted.
    const server = Testing.Http.server((_req) => new Promise<Response>(() => {}));
    const a = server.url.join('x', 'a.txt');
    const b = server.url.join('x', 'b.txt');
    const outDir = await mkTmpDir();

    const until = rx.disposable();
    const events: t.HttpPullEvent[] = [];
    const iter = HttpPull.stream([a, b], outDir, { until, concurrency: 2 });
    queueMicrotask(() => until.dispose()); // ← cancel immediately on next microtask.

    for await (const ev of iter) events.push(ev);

    // Cancellation is quiet: no 'done' and no 'error'
    expect(events.some((e) => e.kind === 'done')).to.eql(false);
    expect(events.some((e) => e.kind === 'error')).to.eql(false);

    await server.dispose();
  });

  describe('stream.events() - observable', () => {
    it('emits start/done and completes (observable)', async () => {
      // Keep server simple; start events may be missed by late subscription.
      const server = Testing.Http.server((req) => Testing.Http.text(req, 'OK'));
      const a = server.url.join('p', 'a.txt');
      const b = server.url.join('p', 'b.txt');
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

      await server.dispose();
    });

    it('cancel(reason) → completes observable quietly (no done/error)', async () => {
      // Never-responding server; stream should end quietly on cancel.
      const server = Testing.Http.server((_req) => new Promise<Response>(() => {}));
      const a = server.url.join('x', 'a.txt');
      const b = server.url.join('x', 'b.txt');
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

      await server.dispose();
    });

    it('events(until) has independent lifetime from iterator (observable completes; iterator continues)', async () => {
      const server = Testing.Http.server((req) => Testing.Http.text(req, 'OK'));
      const a = server.url.join('p', 'a.txt');
      const b = server.url.join('p', 'b.txt');
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
      const local = rx.disposable();
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

      await server.dispose();
    });
  });
});
