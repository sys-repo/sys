import { Bytes, Is, Path, Str, type t } from '../common.ts';
import { invalidPath } from './error.ts';

const PATH = Path.Bounded.posix();
export const MAX_OBJECT_KEY_BYTES = 1024;

export type ObjectKeyPrefix = {
  readonly possible: boolean;
  readonly prefix?: string;
};

/** Normalize an optional Files-visible path. */
export function visiblePath(input: unknown): t.Files.String.Path {
  return Path.Bounded.visible(PATH, input, filesInvalid) as t.Files.String.Path;
}

/** Normalize a required Files-visible path. */
export function requiredVisiblePath(input: unknown): t.Files.String.Path {
  if (input === undefined) throw invalidPath('Files path is required');
  return visiblePath(input);
}

/** Normalize the backing object-key prefix. */
export function toPrefix(input: string | undefined): string {
  if (input === undefined) return '';
  if (!Is.string(input)) throw invalidPath('R2 Files prefix must be a string');
  const trimmed = input.trim();
  if (trimmed === '' || trimmed === '/') return '';
  if (trimmed.startsWith('./') || trimmed.startsWith('/./')) {
    throw invalidPath(`Invalid R2 Files prefix: ${input}`);
  }
  const unwrapped = Str.trimSlashes(trimmed);
  const prefix = Path.Bounded.visible(PATH, unwrapped, filesInvalid);
  if (prefix === '.') return '';
  assertObjectKeyBytes(prefix, 'R2 Files prefix');
  if (Bytes.utf8ByteLength(`${prefix}/x`) > MAX_OBJECT_KEY_BYTES) {
    throw invalidPath('R2 Files prefix leaves no room for object keys');
  }
  return prefix;
}

/** Convert a Files path to an R2 object key under the backing prefix. */
export function objectKey(prefix: string, path: t.Files.String.Path): string {
  if (path === '') throw invalidPath('R2 object key path is required');
  const key = prefix ? `${prefix}/${path}` : path;
  assertObjectKeyBytes(key, 'R2 object key');
  return key;
}

/** Prefix used for listing all objects inside the backing namespace. */
export function namespacePrefix(prefix: string): string | undefined {
  return prefix ? `${prefix}/` : undefined;
}

/** Prefix used for listing descendants of a Files path. */
export function descendantPrefix(prefix: string, path: t.Files.String.Path): ObjectKeyPrefix {
  if (path === '') return { possible: true, prefix: namespacePrefix(prefix) };
  const child = `${objectKey(prefix, path)}/`;
  if (Bytes.utf8ByteLength(child) > MAX_OBJECT_KEY_BYTES) return { possible: false };
  return { possible: true, prefix: child };
}

/** Convert a provider object key back to a Files-visible path, when in scope. */
export function pathFromObjectKey(prefix: string, key: string): t.Files.String.Path | undefined {
  if (prefix === '') return visiblePath(key);
  const ns = `${prefix}/`;
  if (!key.startsWith(ns)) return undefined;
  return visiblePath(key.slice(ns.length));
}

/** Return the parent path, or root for a direct child. */
export function parentPath(path: t.Files.String.Path): t.Files.String.Path {
  return Path.Bounded.parent(path, filesInvalid) as t.Files.String.Path;
}

/** Relative path from one Files path to another. */
export function relativePath(
  from: t.Files.String.Path,
  to: t.Files.String.Path,
): t.StringRelativePath {
  return PATH.relative(from, to).replaceAll('\\', '/') as t.StringRelativePath;
}

/** True when a path is within the given scope. */
export function withinScope(path: t.Files.String.Path, base: t.Files.String.Path): boolean {
  if (base === '') return true;
  const relative = relativePath(base, path);
  return relative === '' || (!relative.startsWith('../') && relative !== '..');
}

/** True when a path is within the requested traversal depth. */
export function withinDepth(
  path: t.Files.String.Path,
  base: t.Files.String.Path,
  depth: t.Files.Depth | undefined,
): boolean {
  if (depth === undefined) return true;
  const current = base === '' ? path : relativePath(base, path);
  if (current === '') return true;
  return Str.splitPathSegments(current).length <= depth;
}

/** Ancestor paths from nearest root-child to parent. */
export function ancestors(path: t.Files.String.Path): readonly t.Files.String.Path[] {
  const parts = Str.splitPathSegments(path);
  const result: t.Files.String.Path[] = [];
  let current = '';
  for (let i = 0; i < parts.length - 1; i++) {
    current = current ? `${current}/${parts[i]}` : parts[i];
    result.push(current as t.Files.String.Path);
  }
  return result;
}

/** Encode an object key as URL path segments. */
export function encodeKeyPath(key: string): string {
  return key.split('/').map((part) => encodeURIComponent(part)).join('/');
}

function assertObjectKeyBytes(key: string, label: string): void {
  if (Bytes.utf8ByteLength(key) > MAX_OBJECT_KEY_BYTES) {
    throw invalidPath(`${label} exceeds ${MAX_OBJECT_KEY_BYTES} UTF-8 bytes`);
  }
}

function filesInvalid(message: string): Error {
  return invalidPath(message.startsWith('Path ') ? `Files path ${message.slice(5)}` : message);
}
