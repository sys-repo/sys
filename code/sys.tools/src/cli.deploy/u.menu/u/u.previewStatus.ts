import { Pkg, type t } from '../../common.ts';
import { DIST_VERIFY_LIMITS } from '../../u.staging/u.verifyStagedDist.ts';

type PreviewStatus =
  | {
    readonly kind: 'verified';
    readonly evidence: t.Pkg.Dist.Local.Verify.Evidence;
  }
  | {
    readonly kind: 'unavailable';
    readonly reason: t.Pkg.Dist.Local.Verify.FailureKind;
  };

/** Obtain fresh exact-root evidence for endpoint-menu status without starting a listener. */
export async function previewStatus(
  dir: t.StringDir,
  until?: t.UntilInput,
): Promise<PreviewStatus> {
  try {
    const result = await Pkg.Dist.Local.verify({
      dir,
      limits: DIST_VERIFY_LIMITS,
      until,
    });
    if (result.kind === 'verified') {
      return Object.freeze({ kind: 'verified', evidence: result.evidence });
    }
    return unavailable(result.kind);
  } catch {
    return unavailable('io-failure');
  }
}

function unavailable(reason: t.Pkg.Dist.Local.Verify.FailureKind): PreviewStatus {
  return Object.freeze({ kind: 'unavailable', reason });
}
