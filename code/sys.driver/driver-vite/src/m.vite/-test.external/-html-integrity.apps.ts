import { describe, expect, Fs, it } from '../../-test.ts';
import { attestIntegrity } from './u.html-integrity.attest.ts';
import { assertRunOk, runTask, workspaceRoot } from './u.fixture.run.ts';

// Product inventory, not fixtures/archives. Compatible configs inherit the driver default unchanged.
const APPS = [
  'code/sys.dev',
  'code/sys.ui/ui',
  'code/sys.ui/ui-components',
  'code/sys.ui/ui-dev',
  'code/sys.driver/driver-automerge',
  'code/sys.driver/driver-monaco',
  'code/sys.driver/driver-pi',
  'code/sys.driver/driver-prosemirror',
  'code/sys.driver/driver-stripe',
  'deploy/@draft.shell',
  'deploy/@tdb.data',
  'deploy/@tdb.edu.slug',
  'deploy/@tdb.slc',
  'deploy/@tdb.slc.std',
] as const;

describe('Active apps → inherited HTML integrity in production products', () => {
  for (const app of APPS) {
    it(`${app} → declared check/build and final written bytes agree`, async () => {
      const cwd = Fs.join(await workspaceRoot(), app);
      for (const task of ['check', 'build']) {
        const result = await runTask(cwd, task);
        assertRunOk(result, `${app}: ${task}`);
        console.info(`${app}: deno task ${task}\n${result.stdout}\n${result.stderr}`);
      }
      const product = await attestIntegrity(Fs.join(cwd, 'dist'));
      console.info('App SRI acceptance:', {
        app,
        references: product.references,
        external: product.external,
      });
      if (app === 'code/sys.driver/driver-monaco') {
        // The late Monaco writer owns only vs/. Attestation above sees bytes AFTER that writer.
        expect(product.references.every((item) => !item.path.startsWith('vs/'))).to.eql(true);
        expect(await Fs.exists(Fs.join(cwd, 'dist/vs/loader.js'))).to.eql(true);
      }
    });
  }

  it('R2 sample → preserves inherited integrity, projections, and private/public policy', async () => {
    const cwd = Fs.join(await workspaceRoot(), 'code/sys.driver/driver-cloudflare/-sample/deploy');
    // The sample owns no check task; use its declared routine and real-build attestation lanes.
    for (const task of ['test', 'test:integrity']) {
      const result = await runTask(cwd, task);
      assertRunOk(result, `R2 sample: ${task}`);
      console.info(`R2 sample: deno task ${task}\n${result.stdout}\n${result.stderr}`);
    }
  });
});
