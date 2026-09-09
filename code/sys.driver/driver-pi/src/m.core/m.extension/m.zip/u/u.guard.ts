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
  const values = capturePaths(input, ['path'], maxChars);
  assertZipSuffix(values.path);
  return values.path;
}

/**
 * Capture the exact extraction arguments before filesystem or queue authority.
 */
export function captureExtractPaths(input: unknown, maxChars: number) {
  const values = capturePaths(input, ['path', 'to'], maxChars);
  assertZipSuffix(values.path);
  return { path: values.path, to: values.to };
}

function capturePaths(input: unknown, names: readonly string[], maxChars: number) {
  if (
    !Is.object(input) || Is.Native.proxy(input) || Object.getPrototypeOf(input) !== Object.prototype
  ) {
    throw guardFailure('parameters must be a plain object');
  }
  const keys = Reflect.ownKeys(input);
  if (keys.length !== names.length || keys.some((key) => !Is.string(key) || !names.includes(key))) {
    throw guardFailure(`parameters require exactly ${names.join(', ')}`);
  }
  const values: Record<string, string> = {};
  for (const name of names) values[name] = captureValue(input, name, maxChars);
  return values;
}

function captureValue(input: object, name: string, maxChars: number) {
  const descriptor = Object.getOwnPropertyDescriptor(input, name);
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
  return path;
}

function assertZipSuffix(path: string) {
  if (!fold(path, 'NFC').endsWith('.zip')) throw guardFailure('source path must end with .zip');
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
 * Admit an absent destination through an existing canonical parent without reading source bytes.
 * Re-run inside the host callback; these observations are cooperative evidence, not confinement.
 */
export async function guardDestination(
  cwd: string,
  requested: string,
  policy: t.PiZipExtension.Policy,
  check: () => void,
) {
  if (!Is.string(cwd) || !Path.Is.absolute(cwd)) throw guardFailure('tool cwd must be absolute');
  const lexical = Path.resolve(cwd, requested);
  const root = policy.writeRoots.find((item) =>
    within(item, lexical) && Path.Is.within(item.path, lexical)
  );
  if (!root) throw guardFailure('destination is outside configured writable roots');
  assertDestinationScope(lexical, policy);
  check();
  if (await lstat(lexical)) throw guardFailure('destination is occupied; overwrite is refused');
  check();
  const parent = Path.dirname(lexical);
  let current = parent;
  let parentIdentity: Identity | undefined;
  let observed = 0;
  while (true) {
    check();
    const info = await lstat(current);
    check();
    if (!info || !info.isDirectory || info.isSymlink) {
      throw guardFailure('destination requires an existing non-symlink directory parent chain');
    }
    const identity = fileIdentity(info);
    if (!identity) throw guardFailure('destination identity evidence is unsupported');
    if (current === parent) parentIdentity = identity;
    if (policy.protectedRoots.some((item) => sameIdentity(item.identity, identity))) {
      throw guardFailure('destination ancestry aliases a protected root');
    }
    if (current === root.path) {
      if (!sameIdentity(root.identity, identity)) throw guardFailure('destination root changed');
      break;
    }
    const next = Path.dirname(current);
    if (next === current || !Path.Is.within(root.path, next)) {
      throw guardFailure('destination ancestry escaped its writable root');
    }
    current = next;
    if (++observed % 32 === 0) await Schedule.tick();
  }
  const canonicalParent = await realPath(parent);
  check();
  if (
    !root.real || !withinReal(root, canonicalParent) || !Path.Is.within(root.real, canonicalParent)
  ) {
    throw guardFailure('destination parent escaped its canonical writable root');
  }
  const resolved = Path.join(canonicalParent, Path.basename(lexical));
  assertDestinationScope(resolved, policy);
  if (!parentIdentity) throw guardFailure('destination parent identity is unavailable');
  return {
    requested,
    resolved,
    root: root.real,
    relative: Path.relative(root.real, resolved),
    parentIdentity,
  };
}

function assertDestinationScope(path: string, policy: t.PiZipExtension.Policy) {
  assertNotProtected(path, policy);
  for (const root of [...policy.readRoots, ...policy.writeRoots, ...policy.protectedRoots]) {
    for (const form of ['NFC', 'NFD'] as const) {
      const target = fold(path, form);
      if (
        pathWithin(target, fold(root.path, form)) ||
        (root.real && pathWithin(target, fold(root.real, form)))
      ) {
        throw guardFailure('destination contains a protected or operation root');
      }
    }
  }
  if (policy.protectedRoots.some((root) => withinReal(root, path))) {
    throw guardFailure('destination resolves inside a protected root');
  }
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

/**
 * Compare complete device/inode observations without accepting missing evidence.
 */
export function sameIdentity(a: Identity | undefined, b: Identity | undefined): boolean {
  return a !== undefined && b !== undefined && a.dev === b.dev && a.ino === b.ino;
}

function segments(path: string): readonly string[] {
  return path.split(/[\\/]+/).filter((part) => part.length > 0);
}

function hasUnsafeText(text: string): boolean {
  return /[\p{Cc}\u2028-\u202e\u2066-\u2069]/u.test(text);
}
