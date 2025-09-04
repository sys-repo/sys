import { describe, expect, Fs, it, Path, Testing } from '../../../-test.ts';
import { HttpPull } from '../mod.ts';

describe('HttpPull.stream', () => {
  const mkTmpDir = async () => (await Fs.makeTempDir({ prefix: 'http-pull-' })).absolute;

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
});
