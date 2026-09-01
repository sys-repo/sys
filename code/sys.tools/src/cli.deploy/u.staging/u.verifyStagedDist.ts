import { Pkg, type t } from '../common.ts';

/** One finite Deploy policy shared by staging and verified local preview. */
export const DEPLOY_DIST_VERIFY_LIMITS = Object.freeze(
  {
    manifestBytes: 16 * 1024 * 1024,
    entries: 8_193,
    fileBytes: 128 * 1024 * 1024,
    totalBytes: 1024 * 1024 * 1024,
  } satisfies t.Pkg.Dist.Local.Verify.Limits,
);

/** Verify one completed staging root or fail without returning partial authority. */
export async function verifyStagedDist(
  dir: t.StringDir,
  until?: t.UntilInput,
): Promise<t.Pkg.Dist.Local.Verify.Evidence> {
  const result = await Pkg.Dist.Local.verify({
    dir,
    limits: DEPLOY_DIST_VERIFY_LIMITS,
    ...(until === undefined ? {} : { until }),
  });
  if (result.kind === 'verified') return result.evidence;
  throw new Error(`Deploy staging verification failed: ${result.kind}.`);
}
