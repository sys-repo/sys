import { Rx, type t } from './common.ts';
import { snapshotManifestArgs } from './u.admitManifest.input.ts';
import { checkCancelled, isFailure } from './u.io.ts';
import { admitManifestBytes } from './u.manifest.ts';

/**
 * Admit manifest bytes against an expected checksum, without filesystem or network I/O.
 */
export const admitPinnedManifest: t.Pkg.Dist.Pinned.AdmitManifest.Method = async (input) => {
  let args: t.Pkg.Dist.Pinned.AdmitManifest.Args;
  let life: t.Abortable;
  try {
    args = snapshotManifestArgs(input);
    life = Rx.abortable(args.until);
  } catch (cause) {
    return failed(isFailure(cause) ? admissionFailureKind(cause.kind) : 'invalid-input');
  }

  try {
    // As in complete verification, observe already-ended lifecycle bridges before work.
    await Promise.resolve();
    checkCancelled(life.signal);
    const admitted = await admitManifestBytes(args.bytes, args.limits, args.integrity);
    checkCancelled(life.signal);
    const evidence: t.Pkg.Dist.Pinned.AdmitManifest.Evidence = Object.freeze({
      integrity: admitted.integrity,
      manifestBytes: args.bytes.byteLength,
      dist: admitted.dist,
    });
    return Object.freeze({ kind: 'manifest-admitted', evidence });
  } catch (cause) {
    return failed(isFailure(cause) ? admissionFailureKind(cause.kind) : 'malformed');
  } finally {
    life.dispose();
  }
};

/** Keep filesystem-only failure categories out of the manifest-only contract. */
function admissionFailureKind(
  kind: t.Pkg.Dist.Verify.FailureKind,
): t.Pkg.Dist.Pinned.AdmitManifest.FailureKind {
  switch (kind) {
    case 'invalid-input':
    case 'integrity-mismatch':
    case 'malformed':
    case 'unsafe-path':
    case 'limit-exceeded':
    case 'cancelled':
      return kind;
    default:
      return 'malformed';
  }
}

function failed(
  kind: t.Pkg.Dist.Pinned.AdmitManifest.FailureKind,
): t.Pkg.Dist.Pinned.AdmitManifest.Failure {
  return Object.freeze({ kind });
}
