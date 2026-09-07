import { lstat, realPath } from '@sys/fs/observe';
import type { t } from '../common.ts';
import { Is, Num, Obj, Path, Schedule } from '../common.ts';

type Root = t.PiZipExtension.RootEvidence;
type Identity = t.PiZipExtension.Identity;

const FAILURES = new WeakSet<object>();

/**
 * Authenticate only errors created by the wrapper's own guard/work-budget boundary.
 */
export function isGuardFailure(input: unknown): input is Error {
  return Is.object(input) && FAILURES.has(input);
}

/**
 * Create a bounded, wrapper-owned reason; arbitrary filesystem error text is never admitted.
 */
export function guardFailure(reason: string): Error {
  const error = new Error(reason);
  FAILURES.add(error);
  return Object.freeze(error);
}

/**
 * Snapshot exactly one own string path without invoking input accessors or proxy traps.
 */
export function capturePath(input: unknown, maxChars: number): string {
  if (
    !Is.object(input) || Is.Native.proxy(input) || Object.getPrototypeOf(input) !== Object.prototype
  ) {
    throw guardFailure('parameters must be a plain object');
  }
  const keys = Reflect.ownKeys(input);
  if (keys.length !== 1 || keys[0] !== 'path') {
    throw guardFailure('parameters require exactly path');
  }
  const descriptor = Object.getOwnPropertyDescriptor(input, 'path');
  if (!descriptor || !Obj.hasOwn(descriptor, 'value') || !Is.string(descriptor.value)) {
    throw guardFailure('path must be a string data property');
  }
  const path = descriptor.value;
  if (path.length > maxChars) throw guardFailure('path exceeds the argument limit');
  if (!path.trim()) throw guardFailure('path must not be empty');
  if (hasUnsafeText(path)) {
    throw guardFailure('path contains control or terminal-escape characters');
  }
  if (path.startsWith('~')) throw guardFailure('tilde paths are not expanded');
  if (/[\*?\[\]{}]/u.test(path)) throw guardFailure('glob-shaped paths are refused');
  if (segments(path).includes('..')) throw guardFailure('parent path segments are refused');
  if (!fold(path, 'NFC').endsWith('.zip')) throw guardFailure('source path must end with .zip');
  return path;
}

/**
 * Guard policy before the byte-owning Snapshot call; observations do not prove stable ancestry.
 */
export async function guardSource(
  cwd: string,
  requested: string,
  policy: t.PiZipExtension.Policy,
  check: () => void,
) {
  if (!Is.string(cwd) || !Path.Is.absolute(cwd)) throw guardFailure('tool cwd must be absolute');
  const resolved = Path.resolve(cwd, requested);
  const root = policy.readRoots.find((item) => within(item, resolved));
  if (!root) throw guardFailure('source is outside configured readable roots');
  assertNotProtected(resolved, policy);

  let current = resolved;
  let observed = 0;
  while (true) {
    check();
    const info = await lstat(current);
    check();
    if (!info) throw guardFailure('source or ancestor is missing');
    if (info.isSymlink) throw guardFailure('source symlink traversal is refused');
    if (current === resolved ? !info.isFile : !info.isDirectory) {
      throw guardFailure('source must be a regular file beneath directory ancestors');
    }
    const identity = fileIdentity(info);
    if (policy.protectedRoots.some((item) => sameIdentity(item.identity, identity))) {
      throw guardFailure('source or ancestor aliases a protected control/runtime root');
    }
    if (current === root.path) break;
    const parent = Path.dirname(current);
    if (parent === current || !within(root, parent)) {
      throw guardFailure('source ancestry did not reach its configured readable root');
    }
    current = parent;
    if (++observed % 32 === 0) {
      await Schedule.tick();
      check();
    }
  }

  check();
  const real = await realPath(resolved);
  check();
  if (!withinReal(root, real)) throw guardFailure('source escaped its canonical readable root');
  assertNotProtected(real, policy);
  if (policy.protectedRoots.some((item) => withinReal(item, real))) {
    throw guardFailure('source resolves inside a protected control/runtime root');
  }
  return { requested, resolved, root: root.path };
}

/**
 * Conservatively fold only ASCII case and Unicode normalization, never native alias claims.
 */
export function fold(path: string, form: 'NFC' | 'NFD'): string {
  return path.replaceAll('\\', '/').normalize(form).replace(/[A-Z]/g, (char) => char.toLowerCase());
}

/**
 * Retain device/inode evidence only when represented by non-negative safe integers.
 */
export function fileIdentity(info: Deno.FileInfo): Identity | undefined {
  const { dev, ino } = info;
  return Num.Is.safeInt(dev) && Num.Is.safeInt(ino) && dev >= 0 && ino >= 0
    ? { dev, ino }
    : undefined;
}

function assertNotProtected(path: string, policy: t.PiZipExtension.Policy) {
  const [git, pi, rooted] = policy.protectedNames;
  const reserved = segments(path).some((part) =>
    (['NFC', 'NFD'] as const).some((form) => {
      const value = fold(part, form);
      return value === git || value === pi || value.startsWith(rooted);
    })
  );
  if (reserved) throw guardFailure('source contains a protected path component');
  if (policy.protectedRoots.some((root) => within(root, path))) {
    throw guardFailure('source is inside a protected control/runtime root');
  }
}

function within(root: Root, path: string): boolean {
  return pathWithin(root.foldedNfc, fold(path, 'NFC')) &&
    pathWithin(root.foldedNfd, fold(path, 'NFD'));
}

function withinReal(root: Root, path: string): boolean {
  return root.realFoldedNfc !== undefined && root.realFoldedNfd !== undefined &&
    pathWithin(root.realFoldedNfc, fold(path, 'NFC')) &&
    pathWithin(root.realFoldedNfd, fold(path, 'NFD'));
}

function pathWithin(root: string, path: string): boolean {
  return path === root || path.startsWith(root.endsWith('/') ? root : `${root}/`);
}

function sameIdentity(a: Identity | undefined, b: Identity | undefined): boolean {
  return a !== undefined && b !== undefined && a.dev === b.dev && a.ino === b.ino;
}

function segments(path: string): readonly string[] {
  return path.split(/[\\/]+/).filter((part) => part.length > 0);
}

function hasUnsafeText(text: string): boolean {
  return /[\p{Cc}\u2028-\u202e\u2066-\u2069]/u.test(text);
}
