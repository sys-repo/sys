import { type t, EXCLUDE, Fs, Path, Time, Hash } from '../common.ts';
import { normalizeExt, normalizeExts } from './u.menu.filter.ts';

/**
 * Build a filesystem index snapshot for writing into the CRDT.
 * Produces a flat, mount-relative key/value map of files + dirs.
 */
export async function buildFsIndexSnapshot(input: {
  /** Absolute directory to scan. */
  readonly dir: t.StringDir;

  /** CWD-relative subdir marker stored in the snapshot source. */
  readonly subdir: t.CrdtIndex.Subdir;

  /** Optional filter that shaped the snapshot. */
  readonly filter?: t.CrdtIndex.Fs.Filter;

  /** Optional timestamp override (defaults to Time.now.timestamp). */
  readonly now?: t.UnixTimestamp;
}): Promise<t.CrdtIndex.Fs.Snapshot> {
  const now = input.now ?? Time.now.timestamp;

  const root = input.dir;
  const filter = normalizeFsFilter(input.filter);

  const items = await scanPaths(root);

  let fileCount = 0;
  let dirCount = 0;
  let byteCount = 0;

  const map = new Map<string, t.CrdtIndex.Fs.FsIndexEntry>();

  for (const absPath of items) {
    const info = await Fs.stat(absPath);
    if (!info) continue;

    const rel = toRelPosixPath(root, absPath);
    if (!rel) continue;

    if (info.isDirectory) {
      dirCount++;
      map.set(rel, {
        kind: 'dir',
        mtime: toUnixTimestamp(info.mtime),
      });
      continue;
    }

    if (!info.isFile) continue;

    const ext = normalizeExt(Path.extname(absPath));
    if (!passesExtFilter({ ext, filter })) continue;

    const bytes = typeof info.size === 'number' ? info.size : undefined;
    if (typeof bytes === 'number') byteCount += bytes;
    fileCount++;

    map.set(rel, {
      kind: 'file',
      ext: ext || undefined,
      bytes,
      mtime: toUnixTimestamp(info.mtime),
      hash: await hashFileBestEffort(absPath),
    });
  }

  const entries = toSortedRecord(map);

  return {
    kind: 'fs:index',
    'schema:version': 1,
    source: {
      dir: input.subdir,
      filter: filter ?? undefined,
    },
    meta: {
      createdAt: now,
      updatedAt: now,
      counts: {
        files: fileCount,
        dirs: dirCount,
        bytes: byteCount,
      },
    },
    entries,
  };
}

/**
 * Helpers
 */

/**
 * Best-effort SHA-256 file hashing.
 * Indexing must succeed even if hashing fails (e.g. permissions, races, IO).
 */
async function hashFileBestEffort(absPath: string): Promise<string | undefined> {
  try {
    const bytes = (await Fs.read(absPath)).data;
    return Hash.sha256(bytes);
  } catch {
    return undefined;
  }
}

function toUnixTimestamp(date?: Date | null): t.UnixTimestamp | undefined {
  return date ? (date.getTime() as t.UnixTimestamp) : undefined;
}

/** List all filesystem paths under `root` (files + dirs). */
async function scanPaths(root: t.StringDir): Promise<string[]> {
  const glob = Fs.glob(root, { includeDirs: true, exclude: EXCLUDE });
  const hits = await glob.find('**');
  return hits.map((p) => p.path);
}

/** Convert absolute path → mount-relative POSIX key. */
function toRelPosixPath(rootAbs: string, absPath: string): string | undefined {
  let rel = Path.relative(rootAbs, absPath);

  // Normalize empty / self
  if (!rel || rel === '.' || rel === './') return undefined;

  // Canonicalize to POSIX for CRDT keys
  rel = rel.replaceAll('\\', '/');

  // Defensive: no leading slash
  if (rel.startsWith('/')) rel = rel.slice(1);

  return rel.length > 0 ? rel : undefined;
}

/** Filter normalization (ext lists via shared normalizers; drop empties; drop if empty). */
function normalizeFsFilter(input?: t.CrdtIndex.Fs.Filter): t.CrdtIndex.Fs.Filter | undefined {
  if (!input) return undefined;

  const includeExt = normalizeExts(input.includeExt ?? []);
  const excludeExt = normalizeExts(input.excludeExt ?? []);
  const includeGlob = normalizeGlobList(input.includeGlob ?? []);
  const excludeGlob = normalizeGlobList(input.excludeGlob ?? []);

  const out: t.CrdtIndex.Fs.Filter = {};

  if (includeExt.length > 0) out.includeExt = includeExt;
  if (excludeExt.length > 0) out.excludeExt = excludeExt;
  if (includeGlob.length > 0) out.includeGlob = includeGlob;
  if (excludeGlob.length > 0) out.excludeGlob = excludeGlob;

  return Object.keys(out).length > 0 ? out : undefined;
}

function normalizeGlobList(input: readonly string[]): string[] {
  const uniq = new Set(input.map((s) => s.trim()).filter((s) => s.length > 0));
  return Array.from(uniq);
}

/** Apply include-then-exclude extension logic to files. */
function passesExtFilter(args: {
  readonly ext: string;
  readonly filter?: t.CrdtIndex.Fs.Filter;
}): boolean {
  const { ext, filter } = args;
  if (!filter) return true;

  const include = filter.includeExt ?? [];
  const exclude = filter.excludeExt ?? [];

  // If include is present, ext must be present and included.
  if (include.length > 0) {
    if (!ext) return false;
    if (!include.includes(ext)) return false;
  }

  // Exclude is applied after include.
  if (exclude.length > 0 && ext && exclude.includes(ext)) return false;

  return true;
}

/** Stable record emission (sorted keys). */
function toSortedRecord(map: Map<string, t.CrdtIndex.Fs.FsIndexEntry>): {
  [relPath: string]: t.CrdtIndex.Fs.FsIndexEntry;
} {
  const keys = Array.from(map.keys()).sort();
  const out: Record<string, t.CrdtIndex.Fs.FsIndexEntry> = {};
  for (const k of keys) out[k] = map.get(k)!;
  return out;
}
