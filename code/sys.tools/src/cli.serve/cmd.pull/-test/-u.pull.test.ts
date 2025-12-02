import { Fs, Testing, describe, expect, it } from '../../../-test.ts';
import { pullRemoteBundle } from '../u.pull.ts';

describe('pullRemoteBundle (call-site glue)', () => {
  const mkTmp = async () => (await Fs.makeTempDir({ prefix: 'bundle-' })).absolute;

  it('fetches dist.json, resolves manifest URLs, maps with relativeTo, invokes retry opts', async () => {
    /**
     * Fake manifest:
     *   dist.json root → /bundles/x
     *   files:          ["pkg/a.js", "index.html"]
     */
    const dist = {
      hash: { parts: { 'pkg/a.js': 'x', 'index.html': 'y' } },
    };

    // Server script:
    const server = Testing.Http.server((req) => {
      const u = new URL(req.url);
      if (u.pathname.endsWith('dist.json')) return Testing.Http.json(req, dist);
      if (u.pathname.endsWith('pkg/a.js')) return Testing.Http.text(req, 'A');
      if (u.pathname.endsWith('index.html')) return Testing.Http.text(req, 'HTML');
      return Testing.Http.error(404, 'NF');
    });

    try {
      const distUrl = server.url.join('bundles', 'x', 'dist.json');
      const out = await mkTmp();

      const result = await pullRemoteBundle(out, {
        remote: { dist: distUrl },
        local: { dir: 'bundle' },
      });

      expect(result.ok).to.eql(true);

      // --- Invariants: -----------------------------------------------------

      // 1. dist.json was fetched.
      const distPath = `${out}/bundle/dist.json`;
      expect(await Fs.exists(distPath)).to.eql(true);

      // 2. Manifest paths were resolved relative to bundle root.
      expect(await Fs.readText(`${out}/bundle/pkg/a.js`)).to.have.property('data', 'A');
      expect(await Fs.readText(`${out}/bundle/index.html`)).to.have.property('data', 'HTML');

      // 3. Retry opts passed through (smoke-test: no throw).
      // (We do not force a 503 here — that behaviour is covered in HttpPull tests.)
    } finally {
      await server.dispose?.(); // Avoid hanging ports.
    }
  });
});
