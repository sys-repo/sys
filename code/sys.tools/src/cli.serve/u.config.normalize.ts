import { type t, Fs, Str } from './common.ts';

export function absKey(dir: t.StringDir): t.StringDir {
  return String(dir).replace(/\/+$/, '') as t.StringDir;
}

export function resolveDir(cwd: t.StringDir, dir: t.StringDir): t.StringDir {
  const raw = String(dir ?? '').trim();
  if (!raw || raw === '.') return cwd;
  if (raw.startsWith('/')) return raw as t.StringDir;
  return Fs.join(cwd, Str.trimLeadingDotSlash(raw));
}

export function toStoredDir(cwd: t.StringDir, absDir: t.StringDir): t.StringDir {
  const abs = Str.trimTrailingSlashes(absDir);
  const base = Str.trimTrailingSlashes(cwd);
  if (abs === base) return '.' as t.StringDir;

  const prefix = `${base}/`;
  if (abs.startsWith(prefix)) return abs.slice(prefix.length) as t.StringDir;

  return abs as t.StringDir;
}

export function normalizeLocalDir(localDir: t.StringRelativeDir): t.StringRelativeDir {
  return Str.trimLeadingSlashes(localDir);
}

/**
 * Normalize:
 * - de-dupe locations by absolute identity (cwd + dir)
 * - store locations as '.' / relative when inside cwd (portable config)
 * - merge duplicates deterministically
 */
export async function normalize(config: t.ServeTool.Config, cwd?: t.StringDir) {
  const current = config.current;

  // If no cwd is provided, we cannot safely resolve rel-vs-abs identity.
  if (!cwd) return;

  const input = current.dirs ?? [];
  if (!input.length) return;

  const out: t.ServeTool.DirConfig[] = [];
  const byAbs = new Map<string, t.ServeTool.DirConfig>();

  let changed = false;

  for (const item of input) {
    const abs = resolveDir(cwd, item.dir);
    const key = String(absKey(abs));
    const stored = toStoredDir(cwd, abs);

    const existing = byAbs.get(key);
    if (!existing) {
      const next: t.ServeTool.DirConfig =
        item.dir === stored ? { ...item } : { ...item, dir: stored };
      if (next.dir !== item.dir) changed = true;

      out.push(next);
      byAbs.set(key, next);
      continue;
    }

    changed = true;
    mergeLocation(existing, item);
  }

  // Ensure stored dir is canonical after merges.
  for (const item of out) {
    const abs = resolveDir(cwd, item.dir);
    const stored = toStoredDir(cwd, abs);
    if (item.dir !== stored) {
      item.dir = stored;
      changed = true;
    }
  }

  if (changed) current.dirs = out;
  if (config.fs.pending) await config.fs.save();
}

function mergeLocation(dst: t.ServeTool.DirConfig, src: t.ServeTool.DirConfig) {
  // createdAt: keep oldest if present
  if (src.createdAt && (!dst.createdAt || src.createdAt < dst.createdAt))
    dst.createdAt = src.createdAt;

  // modifiedAt: keep newest
  if (src.modifiedAt && (!dst.modifiedAt || src.modifiedAt > dst.modifiedAt))
    dst.modifiedAt = src.modifiedAt;

  // lastUsedAt: keep newest
  if (src.lastUsedAt && (!dst.lastUsedAt || src.lastUsedAt > dst.lastUsedAt))
    dst.lastUsedAt = src.lastUsedAt;

  // name: prefer first-seen, otherwise take src
  if (!dst.name && src.name) dst.name = src.name;

  // contentTypes: union, preserve order
  dst.contentTypes = mergeUnique(dst.contentTypes ?? [], src.contentTypes ?? []);

  // remoteBundles: union by (remote.dist + local.dir), merge lastUsedAt
  dst.remoteBundles = mergeRemoteBundles(dst.remoteBundles ?? [], src.remoteBundles ?? []);
}

function mergeUnique<T extends string>(a: readonly T[], b: readonly T[]): T[] {
  const out = [...a];
  for (const v of b) if (!out.includes(v)) out.push(v);
  return out;
}

function mergeRemoteBundles(
  a: readonly t.ServeTool.DirRemoteBundle[],
  b: readonly t.ServeTool.DirRemoteBundle[],
): t.ServeTool.DirRemoteBundle[] {
  const out: t.ServeTool.DirRemoteBundle[] = [...a];

  const keyOf = (m: t.ServeTool.DirRemoteBundle) =>
    `${m.remote.dist}::${normalizeLocalDir(m.local.dir)}`;
  const index = new Map<string, t.ServeTool.DirRemoteBundle>();

  for (const item of out) index.set(keyOf(item), item);

  for (const item of b) {
    const k = keyOf(item);
    const hit = index.get(k);

    if (!hit) {
      const next: t.ServeTool.DirRemoteBundle = {
        ...item,
        local: { ...item.local, dir: normalizeLocalDir(item.local.dir) },
      };
      out.push(next);
      index.set(k, next);
      continue;
    }

    // Merge lastUsedAt if present.
    if (item.lastUsedAt && (!hit.lastUsedAt || item.lastUsedAt > hit.lastUsedAt)) {
      hit.lastUsedAt = item.lastUsedAt;
    }
  }

  return out;
}
