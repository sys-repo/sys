import { Num, Path, Str, type t } from '../common.ts';
import type { StrictPart } from './u.pinned.manifest.ts';
import {
  checkCancelled,
  failure,
  ioFailure,
  type ReadHandle,
  type VerifyPinnedIo,
} from './u.pinned.io.ts';

const compare = Str.Compare.codeUnit();
const INDEX = new WeakMap<TreeSnapshot, ReadonlyMap<string, TreeEntry>>();

export type Identity = {
  readonly dev: number;
  readonly ino: number;
};

export type Metadata = {
  readonly kind: 'file' | 'directory';
  readonly identity: Identity;
  readonly size: t.NumberBytes;
  readonly modified: number | null;
  readonly changed: number | null;
};

export type RootState = {
  readonly path: t.StringAbsoluteDir;
  readonly metadata: Metadata & { readonly kind: 'directory' };
};

export type TreeEntry = Metadata & {
  readonly path: t.StringRelativePath;
};

export type TreeSnapshot = {
  readonly root: Metadata & { readonly kind: 'directory' };
  readonly entries: readonly TreeEntry[];
};

export type ReadValue = {
  readonly bytes: Uint8Array;
  readonly metadata: Metadata & { readonly kind: 'file' };
};

type ObserveTreeOptions = {
  readonly transitionKind?: 'changed';
  readonly expected?: {
    readonly path: t.StringRelativePath;
    readonly metadata: Metadata;
  };
};

export async function resolveRoot(
  io: VerifyPinnedIo,
  input: string,
  signal: AbortSignal,
): Promise<RootState> {
  const absolute = Path.resolve(input);
  let initial: (Metadata & { readonly kind: 'directory' }) | undefined;
  for (const current of ancestorChain(absolute)) {
    checkCancelled(signal);
    const info = await lstatMaybe(io, current);
    if (!info) throw failure('missing');
    if (info.isSymlink) throw failure('symlink');
    if (!info.isDirectory) {
      throw failure(current === absolute ? 'content-mismatch' : 'unsafe-path');
    }
    if (current === absolute) initial = directoryMetadata(info);
  }
  if (!initial) throw failure('io-failure');

  const selectedInfo = await lstatMaybe(io, absolute);
  if (!selectedInfo) throw failure('changed');
  const selected = expectedDirectoryMetadata(selectedInfo);
  if (!sameMetadata(initial, selected)) throw failure('changed');

  let canonical: string;
  try {
    canonical = await io.realPath(absolute);
  } catch (cause) {
    if (isPathTransition(cause)) throw failure('changed');
    throw ioFailure(cause);
  }
  checkCancelled(signal);

  const canonicalInfo = await lstatMaybe(io, canonical);
  if (!canonicalInfo) throw failure('changed');
  const metadata = expectedDirectoryMetadata(canonicalInfo);
  if (!sameMetadata(selected, metadata)) throw failure('changed');

  return Object.freeze({
    path: canonical as t.StringAbsoluteDir,
    metadata,
  });
}

export async function readManifest(
  io: VerifyPinnedIo,
  root: RootState,
  maxBytes: number,
  signal: AbortSignal,
  expected?: Metadata,
): Promise<ReadValue> {
  return await readRegularFile(io, root, 'dist.json', maxBytes, signal, {
    expected,
    missing: expected ? 'changed' : 'missing',
    wrongKind: expected ? 'changed' : 'content-mismatch',
  });
}

export async function readAsset(
  io: VerifyPinnedIo,
  root: RootState,
  part: StrictPart,
  observed: Metadata,
  maxBytes: number,
  signal: AbortSignal,
): Promise<ReadValue> {
  const value = await readRegularFile(io, root, part.path, maxBytes, signal, {
    expected: observed,
    missing: 'changed',
    wrongKind: 'changed',
  });
  if (value.metadata.size !== part.size) throw failure('content-mismatch');
  return value;
}

export async function observeTree(
  io: VerifyPinnedIo,
  root: RootState,
  maxEntries: number,
  signal: AbortSignal,
  options: ObserveTreeOptions = {},
): Promise<TreeSnapshot> {
  const rootInfo = await lstatMaybe(io, root.path);
  if (!rootInfo) throw failure('changed');
  const observedRoot = expectedDirectoryMetadata(rootInfo);
  if (!sameMetadata(root.metadata, observedRoot)) throw failure('changed');

  const entries: TreeEntry[] = [];
  const queue: Array<{ readonly absolute: string; readonly relative: string }> = [{
    absolute: root.path,
    relative: '',
  }];
  let observed = 0;
  let cursor = 0;

  while (cursor < queue.length) {
    checkCancelled(signal);
    const directory = queue[cursor++];
    const children: Deno.DirEntry[] = [];
    try {
      for await (const child of io.readDir(directory.absolute)) {
        checkCancelled(signal);
        observed += 1;
        if (observed > maxEntries) throw failure('limit-exceeded');
        children.push(child);
      }
    } catch (cause) {
      if (isPathTransition(cause)) throw failure('changed');
      throw ioFailure(cause);
    }

    // Classify known-observation transitions before generic tree residue.
    const expectedName = directChildName(options.expected?.path, directory.relative);
    if (expectedName && !children.some((child) => child.name === expectedName)) {
      throw failure('changed');
    }
    children.sort((a, b) => {
      if (a.name === expectedName) return b.name === expectedName ? 0 : -1;
      if (b.name === expectedName) return 1;
      return compare(a.name, b.name);
    });

    for (const child of children) {
      checkCancelled(signal);
      const relative = directory.relative ? `${directory.relative}/${child.name}` : child.name;
      const absolute = Path.join(directory.absolute, child.name);
      const info = await lstatMaybe(io, absolute);
      if (!info) throw failure('changed');
      const expected = options.expected?.path === relative ? options.expected.metadata : undefined;
      const transitionKind = expected ? 'changed' : options.transitionKind;
      if (info.isSymlink) throw failure(transitionKind ?? 'symlink');
      const metadata = entryMetadata(info, transitionKind ?? 'unexpected-entry');
      if (expected && !sameMetadata(expected, metadata)) throw failure('changed');
      const entry = Object.freeze({
        path: relative as t.StringRelativePath,
        ...metadata,
      });
      entries.push(entry);
      if (metadata.kind === 'directory') queue.push({ absolute, relative });
    }
  }

  const finalRootInfo = await lstatMaybe(io, root.path);
  if (!finalRootInfo) throw failure('changed');
  const finalRoot = expectedDirectoryMetadata(finalRootInfo);
  if (!sameMetadata(observedRoot, finalRoot)) throw failure('changed');

  entries.sort((a, b) => compare(a.path, b.path));
  const snapshot = Object.freeze({ root: finalRoot, entries: Object.freeze(entries) });
  INDEX.set(snapshot, new Map(entries.map((entry) => [entry.path, entry])));
  return snapshot;
}

export function assertExactTree(snapshot: TreeSnapshot, parts: readonly StrictPart[]): void {
  const files = new Set<string>(['dist.json', ...parts.map((part) => part.path)]);
  const directories = new Set<string>();
  for (const part of parts) {
    let separator = part.path.indexOf('/');
    while (separator >= 0) {
      directories.add(part.path.slice(0, separator));
      separator = part.path.indexOf('/', separator + 1);
    }
  }

  const observed = indexOf(snapshot);
  for (const entry of snapshot.entries) {
    if (files.has(entry.path)) {
      if (entry.kind !== 'file') throw failure('content-mismatch');
      continue;
    }
    if (directories.has(entry.path)) {
      if (entry.kind !== 'directory') throw failure('content-mismatch');
      continue;
    }
    throw failure('unexpected-entry');
  }
  for (const path of files) {
    if (observed.get(path)?.kind !== 'file') throw failure('content-mismatch');
  }
  for (const path of directories) {
    if (observed.get(path)?.kind !== 'directory') throw failure('content-mismatch');
  }
}

export function observedFile(
  snapshot: TreeSnapshot,
  path: string,
  missingKind: t.Pkg.Dist.VerifyPinned.FailureKind = 'content-mismatch',
): Metadata {
  const entry = indexOf(snapshot).get(path);
  if (!entry || entry.kind !== 'file') throw failure(missingKind);
  return entry;
}

export function assertObserved(expected: Metadata, actual: Metadata): void {
  if (!sameMetadata(expected, actual)) throw failure('changed');
}

export function assertUnchanged(before: TreeSnapshot, after: TreeSnapshot): void {
  if (!sameMetadata(before.root, after.root)) throw failure('changed');
  if (before.entries.length !== after.entries.length) throw failure('changed');
  for (let index = 0; index < before.entries.length; index++) {
    const a = before.entries[index];
    const b = after.entries[index];
    if (a.path !== b.path || !sameMetadata(a, b)) throw failure('changed');
  }
}

export function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.byteLength !== b.byteLength) return false;
  for (let index = 0; index < a.byteLength; index++) {
    if (a[index] !== b[index]) return false;
  }
  return true;
}

async function readRegularFile(
  io: VerifyPinnedIo,
  root: RootState,
  relative: string,
  maxBytes: number,
  signal: AbortSignal,
  options: {
    readonly expected?: Metadata;
    readonly missing: t.Pkg.Dist.VerifyPinned.FailureKind;
    readonly wrongKind: t.Pkg.Dist.VerifyPinned.FailureKind;
  },
): Promise<ReadValue> {
  checkCancelled(signal);
  const absolute = Path.join(root.path, relative);
  const beforeInfo = await lstatMaybe(io, absolute);
  if (!beforeInfo) throw failure(options.missing);
  if (beforeInfo.isSymlink) throw failure(options.expected ? 'changed' : 'symlink');
  if (!beforeInfo.isFile) throw failure(options.wrongKind);
  const before = fileMetadata(beforeInfo);
  if (options.expected && !sameMetadata(options.expected, before)) throw failure('changed');
  if (before.size > maxBytes) throw failure('limit-exceeded');

  let handle: ReadHandle;
  try {
    handle = await io.open(absolute);
  } catch (cause) {
    if (isPathTransition(cause)) throw failure('changed');
    throw ioFailure(cause);
  }

  let result: ReadValue | undefined;
  let operationFailure: unknown;
  try {
    const opened = expectedFileMetadata(await handleStat(handle));
    if (!sameMetadata(before, opened)) throw failure('changed');
    if (opened.size > maxBytes) throw failure('limit-exceeded');

    const bytes = new Uint8Array(opened.size);
    let offset = 0;
    while (offset < bytes.byteLength) {
      checkCancelled(signal);
      const read = await handleRead(handle, bytes.subarray(offset));
      if (read === null || read <= 0) throw failure('changed');
      offset += read;
    }
    const extra = new Uint8Array(1);
    const trailing = await handleRead(handle, extra);
    if (trailing !== null) throw failure('changed');
    checkCancelled(signal);

    const afterHandle = expectedFileMetadata(await handleStat(handle));
    if (!sameMetadata(opened, afterHandle)) throw failure('changed');

    const afterPathInfo = await lstatMaybe(io, absolute);
    if (!afterPathInfo) throw failure('changed');
    const afterPath = expectedFileMetadata(afterPathInfo);
    if (!sameMetadata(opened, afterPath)) throw failure('changed');

    const rootInfo = await lstatMaybe(io, root.path);
    if (!rootInfo) throw failure('changed');
    if (!sameMetadata(root.metadata, expectedDirectoryMetadata(rootInfo))) {
      throw failure('changed');
    }

    result = Object.freeze({ bytes, metadata: afterPath });
  } catch (cause) {
    operationFailure = cause;
  }

  try {
    handle.close();
  } catch {
    operationFailure ??= failure('io-failure');
  }
  if (operationFailure) throw operationFailure;
  if (!result) throw failure('io-failure');
  return result;
}

async function lstatMaybe(
  io: VerifyPinnedIo,
  path: string,
): Promise<Deno.FileInfo | undefined> {
  try {
    return await io.lstat(path);
  } catch (cause) {
    if (cause instanceof Deno.errors.NotFound) return undefined;
    if (isPathTransition(cause)) throw failure('changed');
    throw ioFailure(cause);
  }
}

async function handleStat(handle: ReadHandle): Promise<Deno.FileInfo> {
  try {
    return await handle.stat();
  } catch (cause) {
    throw ioFailure(cause);
  }
}

async function handleRead(handle: ReadHandle, buffer: Uint8Array): Promise<number | null> {
  try {
    return await handle.read(buffer);
  } catch (cause) {
    throw ioFailure(cause);
  }
}

function directoryMetadata(info: Deno.FileInfo): Metadata & { readonly kind: 'directory' } {
  if (info.isSymlink) throw failure('symlink');
  if (!info.isDirectory) throw failure('unexpected-entry');
  return Object.freeze({ kind: 'directory', ...metadataBase(info) });
}

function fileMetadata(info: Deno.FileInfo): Metadata & { readonly kind: 'file' } {
  if (info.isSymlink) throw failure('symlink');
  if (!info.isFile) throw failure('unexpected-entry');
  return Object.freeze({ kind: 'file', ...metadataBase(info) });
}

function expectedFileMetadata(info: Deno.FileInfo): Metadata & { readonly kind: 'file' } {
  if (info.isSymlink || !info.isFile) throw failure('changed');
  return Object.freeze({ kind: 'file', ...metadataBase(info) });
}

function expectedDirectoryMetadata(
  info: Deno.FileInfo,
): Metadata & { readonly kind: 'directory' } {
  if (info.isSymlink || !info.isDirectory) throw failure('changed');
  return Object.freeze({ kind: 'directory', ...metadataBase(info) });
}

function entryMetadata(
  info: Deno.FileInfo,
  specialKind: t.Pkg.Dist.VerifyPinned.FailureKind,
): Metadata {
  if (info.isDirectory) return directoryMetadata(info);
  if (info.isFile) return fileMetadata(info);
  throw failure(specialKind);
}

function metadataBase(info: Deno.FileInfo) {
  if (
    !Num.Is.safeInt(info.dev) ||
    info.dev < 0 ||
    !Num.Is.safeInt(info.ino) ||
    info.ino < 0
  ) {
    throw failure('unsupported');
  }
  if (!Num.Is.safeInt(info.size) || info.size < 0) throw failure('unsupported');
  return {
    identity: Object.freeze({ dev: info.dev, ino: info.ino }),
    size: info.size,
    modified: timestamp(info.mtime),
    changed: timestamp(info.ctime),
  } as const;
}

function timestamp(input: Date | null): number | null {
  if (input === null) return null;
  const value = input.getTime();
  if (!Num.Is.safeInt(value)) throw failure('unsupported');
  return value;
}

function sameMetadata(a: Metadata, b: Metadata): boolean {
  return (
    a.kind === b.kind &&
    sameIdentity(a.identity, b.identity) &&
    a.size === b.size &&
    a.modified === b.modified &&
    a.changed === b.changed
  );
}

function sameIdentity(a: Identity, b: Identity): boolean {
  return a.dev === b.dev && a.ino === b.ino;
}

function isPathTransition(cause: unknown): boolean {
  return (
    cause instanceof Deno.errors.NotFound ||
    cause instanceof Deno.errors.NotADirectory ||
    cause instanceof Deno.errors.IsADirectory ||
    cause instanceof Deno.errors.FilesystemLoop
  );
}

function directChildName(path: string | undefined, parent: string): string | undefined {
  if (!path) return undefined;
  const prefix = parent ? `${parent}/` : '';
  if (!path.startsWith(prefix)) return undefined;
  const relative = path.slice(prefix.length);
  return relative && !relative.includes('/') ? relative : undefined;
}

function ancestorChain(path: string): readonly string[] {
  const chain: string[] = [];
  let current = Path.resolve(path);
  while (true) {
    chain.unshift(current);
    const parent = Path.dirname(current);
    if (parent === current) return chain;
    current = parent;
  }
}

function indexOf(snapshot: TreeSnapshot): ReadonlyMap<string, TreeEntry> {
  const index = INDEX.get(snapshot);
  if (!index) throw failure('io-failure');
  return index;
}
