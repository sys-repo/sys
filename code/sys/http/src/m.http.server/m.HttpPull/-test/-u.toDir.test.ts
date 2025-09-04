import { describe, expect, Fs, it, Path, Testing, Time } from '../../../-test.ts';
import { HttpPull } from '../mod.ts';

describe(`HttpPull.toDir`, () => {
  const mkTmpDir = async () => (await Fs.makeTempDir({ prefix: 'http-pull-' })).absolute;

  /**
   * Phase 1 — Mapping & FS basics:
   */
  describe('happy path (mapping & file-system)', () => {
    it('mirrors URL path into FS (default mapping)', async () => {
      const body = 'A';
      const server = Testing.Http.server((req) => Testing.Http.text(req, body));
      const url = server.url.join('path', 'sample', 'a.txt');
      const outDir = await mkTmpDir();

      const { ok, ops } = await HttpPull.toDir([url], outDir);
      expect(ok).to.eql(true);
      expect(ops).to.have.length(1);

      const r = ops[0];
      expect(r.ok).to.eql(true);
      expect(r.status).to.eql(200);
      expect(r.path.target.endsWith('path/sample/a.txt')).to.eql(true);

      const { data } = await Fs.readText(r.path.target);
      expect(data).to.eql(body);

      await server.dispose();
    });

    it('rebases with relativeTo (segment-aware)', async () => {
      const body = 'X';
      const server = Testing.Http.server((req) => Testing.Http.text(req, body));
      const url = server.url.join('path', 'sample', 'a.txt');
      const outDir = await mkTmpDir();

      const { ok, ops } = await HttpPull.toDir([url], outDir, {
        map: { relativeTo: '/path/sample' },
      });
      expect(ok).to.eql(true);

      const r = ops[0];
      expect(r.path.target).to.eql(Path.join(outDir, 'a.txt'));

      await server.dispose();
    });

    it('rebase no-op when non-boundary match', async () => {
      const body = 'Y';
      const server = Testing.Http.server((req) => Testing.Http.text(req, body));
      const url = server.url.join('path', 'sampler', 'a.txt');
      const outDir = await mkTmpDir();

      const { ok, ops } = await HttpPull.toDir([url], outDir, {
        map: { relativeTo: '/path/sample' },
      });
      expect(ok).to.eql(true);

      const r = ops[0];
      expect(r.path.target.endsWith('path/sampler/a.txt')).to.eql(true);

      await server.dispose();
    });

    it('emptyBasename (default "index") and custom override', async () => {
      const body = 'Z';
      const server = Testing.Http.server((req) => Testing.Http.text(req, body));
      const rootUrl = server.url.join('path', 'sample', ''); // trailing slash
      const outDir = await mkTmpDir();

      {
        const { ops } = await HttpPull.toDir([rootUrl], outDir, {
          map: { relativeTo: '/path/sample' },
        });
        expect(ops[0].path.target.endsWith('index')).to.eql(true);
      }
      {
        const { ops } = await HttpPull.toDir([rootUrl], outDir, {
          map: { relativeTo: '/path/sample', emptyBasename: 'root' },
        });
        expect(ops[0].path.target.endsWith('root')).to.eql(true);
      }

      await server.dispose();
    });

    it('includeHost (with port) prefixes host', async () => {
      const body = 'H';

      // Force a port by starting server on random port (Testing.Http does this already).
      const server = Testing.Http.server((req) => Testing.Http.text(req, body));
      const url = server.url.join('path', 'sample', 'a.txt');
      const outDir = await mkTmpDir();

      const { ops } = await HttpPull.toDir([url], outDir, {
        map: { includeHost: true },
      });
      const host = server.url.toURL().host; // domain:port
      expect(ops[0].path.target.endsWith(`${host}/path/sample/a.txt`)).to.eql(true);

      await server.dispose();
    });

    it('mapPath wins over relativeTo/includeHost', async () => {
      const body = 'M';
      const server = Testing.Http.server((req) => Testing.Http.text(req, body));
      const url = server.url.join('any', 'path.js');
      const outDir = await mkTmpDir();

      const { ops } = await HttpPull.toDir([url], outDir, {
        map: {
          relativeTo: '/any',
          includeHost: true,
          mapPath: () => 'custom/out.js' as any,
        },
      });
      expect(ops[0].path.target.endsWith('custom/out.js')).to.eql(true);

      await server.dispose();
    });
  });

  /**
   * Phase 2 — Result shape:
   */
  describe('result shape', () => {
    it('ok:true when all ops succeed; one record per URL', async () => {
      const server = Testing.Http.server((req) => Testing.Http.text(req, 'ok'));
      try {
        const urls = [
          server.url.join('path', 'sample', 'a.txt'),
          server.url.join('path', 'sample', 'b.txt'),
        ];
        const outDir = await mkTmpDir();

        const { ok, ops } = await HttpPull.toDir(urls, outDir);
        expect(ok).to.eql(true);
        expect(ops).to.have.length(urls.length);
        expect(ops.every((r) => r.ok)).to.eql(true);
      } finally {
        await server.dispose();
      }
    });

    it('ok:false when any op fails', async () => {
      const server = Testing.Http.server((req) => {
        const url = new URL(req.url);
        if (url.pathname.endsWith('/good.txt')) return Testing.Http.text(req, 'x');
        return Testing.Http.error(404, 'NF');
      });
      try {
        const urls = [
          server.url.join('path', 'sample', 'good.txt'),
          server.url.join('path', 'sample', 'missing.txt'),
        ];
        const outDir = await mkTmpDir();

        const { ok, ops } = await HttpPull.toDir(urls, outDir);
        expect(ok).to.eql(false);
        expect(ops).to.have.length(2);
        const [a, b] = ops;
        expect(a.ok || b.ok).to.eql(true);
        expect(a.ok && b.ok).to.eql(false);
      } finally {
        await server.dispose();
      }
    });
  });

  /**
   * Phase 3 — Error surfaces:
   */
  describe('errors', () => {
    it('404 → ok:false, status set, no file written', async () => {
      const server = Testing.Http.server(() => Testing.Http.error(404, 'NF'));
      try {
        const url = server.url.join('path', 'sample', 'missing.txt');
        const outDir = await mkTmpDir();

        const { ok, ops } = await HttpPull.toDir([url], outDir);
        expect(ok).to.eql(false);
        const r = ops[0];
        expect(r.ok).to.eql(false);
        expect(r.status).to.eql(404);
        expect(await Fs.exists(r.path.target)).to.eql(false);
      } finally {
        await server.dispose();
      }
    });

    it('invalid URL → ok:false, sanitized target, no write', async () => {
      const outDir = await mkTmpDir();
      const bad = '::::bad::::';

      const { ok, ops } = await HttpPull.toDir([bad], outDir);
      expect(ok).to.eql(false);
      const r = ops[0];

      expect(r.ok).to.eql(false);
      expect(r.error).to.eql('Invalid URL');
      expect(await Fs.exists(r.path.target)).to.eql(false);

      const base = Path.basename(r.path.target);
      expect(base).to.eql('_bad_');
      expect(base.includes('/')).to.eql(false);
      expect(r.path.target.startsWith(outDir)).to.eql(true);
    });
  });

  /**
   * Phase 4 — Content & bytes:
   */
  describe('content & bytes', () => {
    it('binary body saved correctly', async () => {
      const bin = new Uint8Array([1, 2, 3, 4]);
      const server = Testing.Http.server((req) => Testing.Http.blob(req, bin));
      const url = server.url.join('path', 'sample', 'bin.dat');
      const outDir = await mkTmpDir();

      const { ops } = await HttpPull.toDir([url], outDir);
      const r = ops[0];
      expect(r.ok).to.eql(true);
      expect(r.bytes).to.eql(bin.byteLength);

      const buf = await Fs.read(r.path.target);
      expect(buf.ok).to.eql(true);
      expect(buf.data as Uint8Array).to.eql(bin);

      await server.dispose();
    });

    it('zero-length body → bytes:0, file exists empty', async () => {
      const server = Testing.Http.server((req) => Testing.Http.text(req, ''));
      const url = server.url.join('path', 'sample', 'empty.txt');
      const outDir = await mkTmpDir();

      const { ops } = await HttpPull.toDir([url], outDir);
      const r = ops[0];
      expect(r.ok).to.eql(true);
      expect(r.bytes).to.eql(0);

      const stat = await Fs.stat(r.path.target);
      expect(stat?.size).to.eql(0);

      await server.dispose();
    });
  });

  /**
   * Phase 5 — Concurrency:
   */
  describe('concurrency', () => {
    it('concurrency:1 (serial) — both succeed', async () => {
      const server = Testing.Http.server((req) => {
        const url = new URL(req.url);
        if (url.pathname.endsWith('/slow.txt')) {
          return new Promise<Response>((resolve) => {
            Time.delay(30, () => resolve(Testing.Http.text(req, 'SLOW')));
          });
        }
        return Testing.Http.text(req, 'FAST');
      });

      const urls = [
        server.url.join('path', 'sample', 'slow.txt'),
        server.url.join('path', 'sample', 'fast.txt'),
      ];
      const outDir = await mkTmpDir();

      const { ok, ops } = await HttpPull.toDir(urls, outDir, { concurrency: 1 });
      expect(ok).to.eql(true);
      expect(ops.every((r) => r.ok)).to.eql(true);

      await server.dispose();
    });

    it('concurrency:4 (parallel) — completes (order not asserted)', async () => {
      const server = Testing.Http.server((req) => Testing.Http.text(req, 'OK'));
      const urls = [
        server.url.join('path', 'sample', 'a.txt'),
        server.url.join('path', 'sample', 'b.txt'),
        server.url.join('path', 'sample', 'c.txt'),
        server.url.join('path', 'sample', 'd.txt'),
      ];
      const outDir = await mkTmpDir();

      const { ok, ops } = await HttpPull.toDir(urls, outDir, { concurrency: 4 });
      expect(ok).to.eql(true);
      expect(ops).to.have.length(4);
      expect(ops.every((r) => r.ok)).to.eql(true);

      await server.dispose();
    });
  });
});
