import { Is, Json, Num, Obj, Path, Pkg, Str, type t } from './common.ts';

export type ManifestPlan = {
  readonly resources: readonly t.HttpPull.Resource[];
};

export type ManifestAdmission =
  | { readonly ok: true; readonly value: ManifestPlan }
  | {
    readonly ok: false;
    readonly reason: Extract<
      t.Dist.FailureReason,
      'limit-exceeded' | 'malformed-manifest'
    >;
  };

const decoder = new TextDecoder('utf-8', { fatal: true });
const compare = Str.Compare.codeUnit();

/** Decode authenticated manifest bytes into bounded checksum-pinned staging instructions. */
export function admitManifest(
  bytes: Uint8Array,
  finalUrl: t.StringUrl,
  policy: t.Dist.Policy,
): ManifestAdmission {
  let parsed: unknown;
  try {
    parsed = Json.parse<unknown>(decoder.decode(bytes));
  } catch {
    return rejected('malformed-manifest');
  }

  if (!Is.plainObject(parsed) || !Is.plainObject(parsed.hash)) {
    return rejected('malformed-manifest');
  }
  const rawParts = parsed.hash.parts;
  if (!Is.plainObject(rawParts)) return rejected('malformed-manifest');
  const parts = rawParts as Record<string, unknown>;

  let partCount = 0;
  for (const path in rawParts) {
    if (!Obj.hasOwn(rawParts, path)) continue;
    if (partCount >= policy.resources.maxResources) return rejected('limit-exceeded');
    partCount++;
  }
  if (partCount === 0) return rejected('malformed-manifest');
  if (partCount >= policy.verification.entries) return rejected('limit-exceeded');
  if (!Pkg.Is.dist(parsed)) return rejected('malformed-manifest');

  let base: URL;
  try {
    base = new URL('.', finalUrl);
  } catch {
    return rejected('malformed-manifest');
  }

  const entries = [...Obj.entries(parts)].sort(([a], [b]) => compare(a, b));
  const resources: t.HttpPull.Resource[] = [];
  let totalBytes = 0;

  for (const [target, rawPart] of entries) {
    const parsedPart = Pkg.Dist.Part.parse(rawPart);
    if (!parsedPart || parsedPart.size === undefined) return rejected('malformed-manifest');
    if (Path.basename(target).toLowerCase() === 'dist.json') {
      return rejected('malformed-manifest');
    }

    const size = parsedPart.size;
    if (
      size > policy.resources.response.maxBytes ||
      size > policy.verification.fileBytes
    ) {
      return rejected('limit-exceeded');
    }
    if (
      size > policy.resources.maxTotalBytes - totalBytes ||
      size > policy.verification.totalBytes - totalBytes
    ) {
      return rejected('limit-exceeded');
    }
    totalBytes += size;
    if (!Num.Is.safeInt(totalBytes)) return rejected('limit-exceeded');

    let source: t.StringUrl;
    try {
      const encoded = target.split('/').map((segment) => encodeURIComponent(segment)).join('/');
      source = new URL(encoded, base).href;
    } catch {
      return rejected('malformed-manifest');
    }

    resources.push(Object.freeze({
      source,
      target,
      checksum: parsedPart.hash,
      expectedBytes: size,
    }));
  }

  return {
    ok: true,
    value: Object.freeze({ resources: Object.freeze(resources) }),
  };
}

function rejected(
  reason: Extract<t.Dist.FailureReason, 'limit-exceeded' | 'malformed-manifest'>,
): Extract<ManifestAdmission, { readonly ok: false }> {
  return Object.freeze({ ok: false, reason });
}
