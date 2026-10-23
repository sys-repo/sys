import { FsPkg, Num, Pkg, Str, type t } from './common.ts';
import { verificationReason } from './u.failure.ts';

export type ManifestPlan = {
  readonly resources: readonly t.HttpPull.Resource[];
  readonly manifestChecksum: t.StringHash;
};

export type ManifestAdmission =
  | { readonly ok: true; readonly value: ManifestPlan }
  | { readonly ok: false; readonly reason: t.Dist.FailureReason };

const compare = Str.Compare.codeUnit();

/** Admit through FS once, then derive bounded byte-checksummed acquisition from content facts. */
export async function admitManifest(
  bytes: Uint8Array,
  finalUrl: t.StringUrl,
  policy: t.Dist.Policy,
  pin: t.DistPin,
  until?: t.UntilInput,
): Promise<ManifestAdmission> {
  const admitted = await FsPkg.Dist.Pinned.admitManifest({
    bytes,
    pin,
    limits: policy.verification,
    until,
  });
  if (admitted.kind !== 'manifest-admitted') return rejected(verificationReason(admitted));
  const entries = Object.entries(admitted.evidence.content.parts);
  if (entries.length > policy.resources.maxResources) return rejected('limit-exceeded');
  entries.sort(([a], [b]) => compare(a, b));

  let base: URL;
  try {
    base = new URL('.', finalUrl);
  } catch {
    return rejected('malformed-manifest');
  }

  const resources: t.HttpPull.Resource[] = [];
  let totalBytes = 0;
  for (const [target, rawPart] of entries) {
    const part = Pkg.Dist.Part.parse(rawPart);
    if (!part || part.size === undefined) return rejected('malformed-manifest');
    const size = part.size;
    if (
      size > policy.resources.response.maxBytes ||
      size > policy.resources.maxTotalBytes - totalBytes
    ) {
      return rejected('limit-exceeded');
    }
    totalBytes += size;
    if (!Num.Is.safeInt(totalBytes)) return rejected('limit-exceeded');
    const encoded = target.split('/').map((segment) => encodeURIComponent(segment)).join('/');
    resources.push(Object.freeze({
      source: new URL(encoded, base).href,
      target,
      checksum: part.hash,
      expectedBytes: size,
    }));
  }
  return Object.freeze({
    ok: true,
    value: Object.freeze({
      resources: Object.freeze(resources),
      manifestChecksum: admitted.evidence.manifestChecksum,
    }),
  });
}

function rejected(
  reason: t.Dist.FailureReason,
): Extract<ManifestAdmission, { readonly ok: false }> {
  return Object.freeze({ ok: false, reason });
}
