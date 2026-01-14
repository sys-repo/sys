import { Fs, Hash } from './common.ts';

const DEFAULT_SMALL_JSON_MAX_BYTES = 256 * 1024;

/**
 * IMPORTANT:
 *
 * We intentionally do NOT rely solely on {mtime, size} for JSON assets.
 *
 * Rationale:
 *  - Many pipelines rewrite JSON manifests atomically and quickly
 *    (same-size writes within the same mtime tick).
 *  - Browsers cache aggressively using ETag + 304.
 *  - mtime+size can remain identical even when content has changed,
 *    causing stale JSON to be served indefinitely.
 *
 * For small JSON files (manifests, indexes, metadata),
 * we therefore require a content-sensitive ETag.
 *
 * This preserves caching semantics while restoring correctness.
 */
export async function computeEtag(args: { path: string; stat: Deno.FileInfo }): Promise<string> {
  const { path, stat } = args;

  // Strong ETag for small JSON (manifest-style files).
  if (path.toLowerCase().endsWith('.json') && stat.size <= DEFAULT_SMALL_JSON_MAX_BYTES) {
    const bytes = (await Fs.read(path)).data;

    // Invariant:
    // - computeEtag is only called after `stat.isFile === true`
    // - Fs.read(path).data being <undefined> here indicates an internal FS failure
    //   or a broken invariant, not a recoverable condition.
    if (!bytes) throw new Error(`Failed to read file: ${path}`);

    // Hash.sha256 returns a string digest.
    // With { prefix: false } it should omit "sha256-" (and usually omit "0x" too, but we guard anyway).
    const digest = Hash.sha256(bytes, { prefix: false });
    const hex = digest.startsWith('0x') ? digest.slice(2) : digest;
    const tag = hex.slice(0, 16);

    return `"sha256-${tag}"`;
  }

  // Weak-ish ETag based on mtime + size (no full-file hashing).
  // Note: this can collide under rapid rewrites within mtime granularity, hence the JSON exception above.
  const mtime = stat.mtime?.getTime() ?? 0;
  return `"${mtime.toString(36)}-${stat.size.toString(36)}"`;
}
