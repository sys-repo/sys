import { type t, Is, Path } from './common.ts';

/**
 * Lexical path helpers for bundle metadata parity.
 *
 * These helpers intentionally preserve descriptor-facing string formatting (for example `./` path
 * segments used by shard templates) and therefore are not equivalent to canonical filesystem path
 * normalization helpers.
 */

export function resolvePath(baseDir: string, subPath: string, filename?: string): string {
  if (filename && isAbsolutePath(filename)) return filename;
  if (isAbsolutePath(subPath)) return filename ? joinPath(subPath, filename) : subPath;
  return filename ? joinPath(baseDir, subPath, filename) : joinPath(baseDir, subPath);
}

export function toRawPath(baseDir: string, path: string): string {
  const rel = relativePath(baseDir, path);
  if (rel.length > 0 && rel !== '.') return rel;
  return basename(path);
}

export function toRelativeDir(baseDir: string, dir: string): string {
  if (!isAbsolutePath(dir)) return dir;
  const rel = relativePath(baseDir, dir);
  return rel || '.';
}

/**
 * Lexical absolute-path check for metadata inputs.
 *
 * We use `Path.Is.absolute` for native/platform semantics, then explicitly preserve the previous
 * transform behavior for Windows drive paths on non-Windows runtimes.
 */
export function isAbsolutePath(value: string): boolean {
  if (!value) return false;
  if (Path.Is.absolute(value)) return true;
  return /^[A-Za-z]:[\\/]/.test(value);
}

/**
 * Lexical join that preserves relative formatting segments (`./`) for descriptor metadata parity.
 *
 * Do not replace with `Path.join(...)`: std path joining may normalize away formatting segments
 * that are intentionally preserved in emitted bundle metadata.
 */
export function joinPath(...parts: readonly string[]): string {
  const items = parts.filter((v) => Is.str(v) && v.length > 0);
  if (items.length === 0) return '.';
  return items.reduce((acc, next) => {
    if (!acc) return next;
    const left = acc.endsWith('/') ? acc.slice(0, -1) : acc;
    const right = next.startsWith('/') ? next.slice(1) : next;
    return `${left}/${right}`;
  }, '');
}

/**
 * Lexical relative path helper used for metadata rendering.
 *
 * This uses std `Path.relative(...)` for absolute-path semantics (including `../` paths when the
 * target is outside the base), while preserving passthrough behavior for non-absolute inputs.
 */
export function relativePath(baseDir: string, path: string): string {
  if (!isAbsolutePath(baseDir) || !isAbsolutePath(path)) return path;
  return Path.relative(baseDir, path);
}

/**
 * Lexical basename helper for metadata inputs.
 *
 * We normalize `\\` to `/` first so Windows-like path strings are handled consistently in this
 * pure transform layer without adopting platform-specific runtime semantics.
 */
export function basename(path: string): string {
  const normalized = path.replaceAll('\\', '/');
  const parts = normalized.split('/').filter(Boolean);
  return parts[parts.length - 1] ?? normalized;
}

export function toOutputFile(args: {
  baseDir: string;
  path: string;
  filename: string;
}): t.SlugBundleTransform.OutputFile {
  return {
    filename: args.filename as t.StringPath,
    path: args.path as t.StringPath,
    raw: toRawPath(args.baseDir, args.path) as t.StringPath,
  };
}
