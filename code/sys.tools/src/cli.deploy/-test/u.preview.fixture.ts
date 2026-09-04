import { Fs, Path, Pkg, type t } from '../common.ts';
import { DIST_VERIFY_LIMITS } from '../u.staging/u.verifyStagedDist.ts';
import { withTmpDir } from './u.fixture.ts';

type PreviewDistFixture = {
  readonly cwd: t.StringDir;
  readonly root: t.StringAbsoluteDir;
  readonly evidence: t.Pkg.Dist.Local.Verify.Evidence;
};

/** Run a test against one complete, freshly verified sample Dist. */
export async function withPreviewDist(
  fn: (fixture: PreviewDistFixture) => Promise<void> | void,
): Promise<void> {
  await withTmpDir(async (cwd) => {
    const root = Path.resolve(cwd, 'staging');
    await Fs.ensureDir(`${root}/assets`);
    await Fs.ensureDir(`${root}/guides & refs`);
    await Fs.write(`${root}/index.html`, '<h1>root</h1>\n');
    await Fs.write(`${root}/assets/app.js`, 'export const ready = true;\n');
    await Fs.write(`${root}/guides & refs/index.html`, '<h1>nested</h1>\n');
    await Pkg.Dist.compute({ dir: root, save: true });

    const verified = await Pkg.Dist.Local.verify({
      dir: root,
      limits: DIST_VERIFY_LIMITS,
    });
    if (verified.kind !== 'verified') {
      throw new Error(`Preview fixture verification failed: ${verified.kind}`);
    }
    await fn(Object.freeze({ cwd, root, evidence: verified.evidence }));
  });
}
