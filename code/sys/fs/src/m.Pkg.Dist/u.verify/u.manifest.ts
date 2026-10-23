import { normalizeTargets } from '../../m.Fs.capability/m.Rooted/u/u.target.ts';
import { Inventory } from '../m.Inventory.ts';
import type { StrictManifest } from '../t.internal.ts';
import { D, Hash, Is, Json, Obj, Path, Pkg, Str, type t } from './common.ts';
import { failure } from './u.io.ts';

const compare = Str.Compare.codeUnit();
const decoder = new TextDecoder('utf-8', { fatal: true });

/**
 * One fatal UTF-8/native JSON interpretation, then bounded descriptor recomputation.
 * The caller supplies an owned byte snapshot. Excluded metadata is neither traversed nor frozen.
 * Native parsing is byte-bounded, not interruptible or a promise of a nesting/CPU deadline.
 */
export function admitManifestBytes(
  bytes: Uint8Array,
  limits: t.Pkg.Dist.Verify.Limits,
  expected?: t.DistPin,
): StrictManifest & { readonly manifestChecksum: t.StringHash } {
  const parsed = parseManifestBytes(bytes, limits);
  const admitted = admitManifest(parsed, limits, expected);
  return Object.freeze({ ...admitted, manifestChecksum: Hash.sha256(bytes) });
}

/** Bounded document observation; native last-member-wins, including escaped-equivalent names. */
export function parseManifestBytes(bytes: Uint8Array, limits: t.Pkg.Dist.Verify.Limits): unknown {
  if (bytes.byteLength > Math.min(limits.manifestBytes, D.contentLimits.manifestBytes)) {
    throw failure('limit-exceeded');
  }
  try {
    return Json.parse<unknown>(decoder.decode(bytes));
  } catch {
    throw failure('malformed');
  }
}

/** Admit the single parsed document; descriptive members are not authenticated or traversed. */
export function admitManifest(
  parsed: unknown,
  limits: t.Pkg.Dist.Verify.Limits,
  expected?: t.DistPin,
): StrictManifest {
  if (!Is.plainObject(parsed) || !Obj.hasOwn(parsed, 'hash')) throw failure('malformed');
  const hash = parsed.hash;
  if (!Is.plainObject(hash) || !Obj.hasOwn(hash, 'scheme') || !Obj.hasOwn(hash, 'parts')) {
    throw failure('malformed');
  }
  if (hash.scheme !== Pkg.Dist.Content.scheme || !Obj.hasOwn(hash, 'digest')) {
    throw failure('malformed');
  }
  const admitted = captureContent(hash.parts, limits);
  if (hash.digest !== admitted.content.digest) throw failure('malformed');
  if (
    expected &&
    (expected.scheme !== admitted.content.scheme || expected.digest !== admitted.content.digest)
  ) {
    throw failure('pin-mismatch');
  }
  return admitted;
}

/**
 * Shared producer/admission owner: exact portable targets, structural bounds, sizes, and encoding.
 * Callers supply parsed JSON or producer-owned parts, never arbitrary executable object graphs.
 */
export function captureContent(
  input: unknown,
  limits: t.Pkg.Dist.Verify.Limits,
): StrictManifest {
  if (!Is.plainObject(input)) throw failure('malformed');
  const inspected = Inventory.inspect({ parts: input, limits });
  if (inspected.kind !== 'inspected') throw failure(inspected.kind);
  const { totalBytes, packageBytes } = inspected;
  // Sorting and target admission remain here, after the accountant's bounded owned facts.
  const parts = [...inspected.files];
  const targets: t.FsRooted.TargetInput<'file'>[] = parts.map(({ path }) => ({
    kind: 'file',
    path,
  }));
  targets.push({ kind: 'file', path: 'dist.json' });
  try {
    const normalized = normalizeTargets(targets);
    for (let index = 0; index < targets.length; index++) {
      if (targets[index].path !== normalized[index].path) throw failure('unsafe-path');
    }
  } catch {
    throw failure('unsafe-path');
  }
  for (const { path } of parts) {
    const name = Path.basename(path).toLowerCase();
    if (name === 'dist.json' || name === 'dist.json.sig') throw failure('unsafe-path');
  }

  parts.sort((a, b) => compare(a.path, b.path));
  const entries = parts.map(({ path, hash, size }): [string, string] => {
    return [path, `${hash}:size=${size}`];
  });
  const inventory = Object.freeze(Object.fromEntries(entries));
  let encoded: string;
  try {
    encoded = Pkg.Dist.Content.encode(inventory);
  } catch (cause) {
    throw failure(cause instanceof RangeError ? 'limit-exceeded' : 'malformed');
  }
  const content: t.DistContent = Object.freeze({
    scheme: Pkg.Dist.Content.scheme,
    digest: Hash.sha256(encoded),
    parts: inventory,
  });
  return Object.freeze({ content, parts: Object.freeze(parts), totalBytes, packageBytes });
}
