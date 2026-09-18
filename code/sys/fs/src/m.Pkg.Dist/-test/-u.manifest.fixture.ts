import { CompositeHash, Hash, Ignore, Json, type t } from '../../-test.ts';

/** An in-memory manifest with exact byte and entry limits. */
export async function manifestFixture() {
  const parts = {
    'index.html': `${Hash.sha256('abc')}:size=3`,
    'pkg/mod.js': `${Hash.sha256('defg')}:size=4`,
  };
  const dist: t.DeepMutable<t.DistPkg> = {
    type: 'https://example.com/dist',
    build: {
      time: 1,
      size: { total: 7, pkg: 4 },
      builder: '@test/builder@1.0.0',
      runtime: 'test',
      hash: {
        policy: 'https://example.com/hash',
        ignore: { format: 'gitignore', rules: [], 'rules:digest': await Ignore.digest([]) },
      },
    },
    hash: { digest: CompositeHash.digest(parts), parts },
  };
  const bytes = encodeManifest(dist);
  const limits: t.Pkg.Dist.Pinned.AdmitManifest.Limits = {
    manifestBytes: bytes.byteLength,
    entries: 4, // dist.json, index.html, pkg/, pkg/mod.js.
    fileBytes: 4,
    totalBytes: 7,
  };
  return { dist, bytes, integrity: Hash.sha256(bytes), limits };
}

export function encodeManifest(input: unknown): Uint8Array {
  return new TextEncoder().encode(Json.stringify(input));
}
