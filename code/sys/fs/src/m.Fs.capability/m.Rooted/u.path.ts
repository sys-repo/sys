import { Is, StdPath, type t } from './common.ts';
import { checkCancelled, failure, ioFailure, isFailure } from './u.error.ts';
import type { Io } from './u.io.ts';

export const INTERNAL_NAME = '.sys-rooted';
export const TEMP_PREFIX = '.sys-rooted-tmp-';

const DEVICE = /^(con|prn|aux|nul|clock\$|conin\$|conout\$|com[1-9¹²³]|lpt[1-9¹²³])(?:\.|$)/i;
const CONTROL = /[\u0000-\u001f\u007f-\u009f]/;
const RESERVED = /[:"<>|?*]/;

export type Identity = {
  readonly dev: number;
  readonly ino: number;
};

export type RootState = {
  readonly path: t.StringAbsoluteDir;
  readonly identity: Identity;
};

export type NormalizedTarget<K extends t.FsRooted.TargetKind = t.FsRooted.TargetKind> = {
  readonly kind: K;
  readonly path: t.StringRelativePath;
};

export type TargetState<K extends t.FsRooted.TargetKind = t.FsRooted.TargetKind> =
  & NormalizedTarget<K>
  & { readonly absolute: t.StringAbsolutePath };

export async function createRootState(
  root: unknown,
  io: Io,
  signal: AbortSignal,
): Promise<RootState> {
  const operation = 'create';
  if (!Is.str(root) || root.length === 0 || root.includes('\0')) {
    throw failure(operation, 'invalid-root');
  }

  const absolute = StdPath.resolve(root) as t.StringAbsoluteDir;
  await ensureDirectoryPath(
    io,
    StdPath.dirname(absolute),
    operation,
    signal,
    'invalid-root',
    false,
  );
  let rootInfo = await lstatMaybe(io, absolute, operation);
  if (!rootInfo) {
    try {
      await io.mkdir(absolute, { mode: 0o700 });
    } catch (cause) {
      if (!(cause instanceof Deno.errors.AlreadyExists)) throw ioFailure(operation, cause);
    }
    rootInfo = await lstatMaybe(io, absolute, operation);
  }
  if (!rootInfo?.isDirectory || rootInfo.isSymlink) throw failure(operation, 'invalid-root');
  const selectedIdentity = identityRequired(rootInfo, operation);
  checkCancelled(operation, signal);

  let canonical: string;
  try {
    canonical = await io.realPath(absolute);
  } catch (cause) {
    throw ioFailure(operation, cause);
  }

  await ensureDirectoryPath(io, canonical, operation, signal, 'invalid-root', false);
  const info = await lstatRequired(io, canonical, operation, 'invalid-root');
  const identity = identityRequired(info, operation);
  if (!sameIdentity(selectedIdentity, info)) throw failure(operation, 'invalid-root');
  checkCancelled(operation, signal);
  return Object.freeze({
    path: canonical as t.StringAbsoluteDir,
    identity,
  });
}

export function normalizeTargets<K extends t.FsRooted.TargetKind>(
  input: readonly t.FsRooted.TargetInput<K>[],
): readonly NormalizedTarget<K>[] {
  const operation = 'admit';
  if (!Is.array(input)) throw failure(operation, 'invalid-target');

  const targets = input.map((item) => {
    if (!Is.object(item)) throw failure(operation, 'invalid-target');
    if (!(item.kind === 'file' || item.kind === 'directory')) {
      throw failure(operation, 'invalid-target');
    }

    let path: t.StringRelativePath;
    try {
      path = StdPath.Bounded.visible(
        StdPath.Bounded.posix(),
        item.path,
        () => failure(operation, 'invalid-target'),
      );
    } catch (cause) {
      if (isFailure(cause)) throw cause;
      throw failure(operation, 'invalid-target', { cause });
    }

    if (!path) throw failure(operation, 'invalid-target');
    for (const segment of path.split('/')) validateSegment(segment);
    return { kind: item.kind, path };
  });

  const ordered = [...targets].sort((a, b) => compare(a.path, b.path));
  const byPath = new Map<string, NormalizedTarget>();
  for (const target of ordered) {
    if (byPath.has(target.path)) throw failure(operation, 'target-collision');
    byPath.set(target.path, target);
  }

  for (const target of ordered) {
    let separator = target.path.indexOf('/');
    while (separator >= 0) {
      const ancestor = target.path.slice(0, separator);
      if (byPath.get(ancestor)?.kind === 'file') {
        throw failure(operation, 'target-collision');
      }
      separator = target.path.indexOf('/', separator + 1);
    }
  }

  return targets;
}

export async function revalidateRoot(
  io: Io,
  root: RootState,
  operation: t.FsRooted.Operation,
): Promise<void> {
  const info = await lstatRequired(io, root.path, operation, 'unsafe-filesystem');
  if (info.isSymlink || !info.isDirectory) throw failure(operation, 'unsafe-filesystem');
  if (!sameIdentity(root.identity, info)) throw failure(operation, 'unsafe-filesystem');
}

export async function observeTarget(
  io: Io,
  root: RootState,
  target: TargetState,
  operation: t.FsRooted.Operation,
  signal: AbortSignal,
  createParents: boolean,
): Promise<Deno.FileInfo | undefined> {
  await revalidateRoot(io, root, operation);
  let current = root.path as string;
  const segments = target.path.split('/');

  for (let index = 0; index < segments.length; index++) {
    checkCancelled(operation, signal);
    current = StdPath.join(current, segments[index]);
    const final = index === segments.length - 1;
    let info = await lstatMaybe(io, current, operation);

    if (!info && !final && createParents) {
      try {
        await io.mkdir(current);
      } catch (cause) {
        if (!(cause instanceof Deno.errors.AlreadyExists)) throw ioFailure(operation, cause);
      }
      info = await lstatMaybe(io, current, operation);
    }

    if (!info) return undefined;
    if (info.isSymlink) throw failure(operation, 'unsafe-filesystem');
    if (!final && !info.isDirectory) throw failure(operation, 'unsafe-filesystem');
    if (final && target.kind === 'directory' && !info.isDirectory) {
      throw failure(operation, 'unsafe-filesystem');
    }
    if (final && target.kind === 'file' && !info.isFile) {
      throw failure(operation, 'unsafe-filesystem');
    }
    if (final) return info;
  }

  return undefined;
}

export async function ensureDirectoryPath(
  io: Io,
  path: string,
  operation: t.FsRooted.Operation,
  signal: AbortSignal,
  unsafe: 'invalid-root' | 'unsafe-filesystem' = 'unsafe-filesystem',
  create = true,
): Promise<void> {
  for (const current of ancestorChain(path)) {
    checkCancelled(operation, signal);
    let info = await lstatMaybe(io, current, operation);
    if (!info && create) {
      try {
        await io.mkdir(current);
      } catch (cause) {
        if (!(cause instanceof Deno.errors.AlreadyExists)) throw ioFailure(operation, cause);
      }
      info = await lstatMaybe(io, current, operation);
    }
    if (!info || info.isSymlink || !info.isDirectory) throw failure(operation, unsafe);
  }
}

export async function ensureDescendantDirectory(
  io: Io,
  root: RootState,
  path: string,
  operation: t.FsRooted.Operation,
  signal: AbortSignal,
): Promise<void> {
  await revalidateRoot(io, root, operation);
  const relative = StdPath.relative(root.path, path);
  if (!relative || relative === '.' || relative.startsWith('..') || StdPath.Is.absolute(relative)) {
    throw failure(operation, 'unsafe-filesystem');
  }

  let current = root.path as string;
  for (const segment of relative.replaceAll('\\', '/').split('/')) {
    checkCancelled(operation, signal);
    current = StdPath.join(current, segment);
    let info = await lstatMaybe(io, current, operation);
    if (!info) {
      try {
        await io.mkdir(current);
      } catch (cause) {
        if (!(cause instanceof Deno.errors.AlreadyExists)) throw ioFailure(operation, cause);
      }
      info = await lstatMaybe(io, current, operation);
    }
    if (!info?.isDirectory || info.isSymlink) throw failure(operation, 'unsafe-filesystem');
  }
  await revalidateRoot(io, root, operation);
}

export async function lstatMaybe(
  io: Io,
  path: string,
  operation: t.FsRooted.Operation,
): Promise<Deno.FileInfo | undefined> {
  try {
    return await io.lstat(path);
  } catch (cause) {
    if (cause instanceof Deno.errors.NotFound) return undefined;
    throw ioFailure(operation, cause);
  }
}

export function identityRequired(
  info: Deno.FileInfo,
  operation: t.FsRooted.Operation,
  committed = false,
): Identity {
  const identity = identityOf(info);
  if (!identity) throw failure(operation, 'unsupported', { committed });
  return identity;
}

export function sameIdentity(identity: Identity, info: Deno.FileInfo): boolean {
  return info.dev === identity.dev && info.ino === identity.ino;
}

function identityOf(info: Deno.FileInfo): Identity | undefined {
  if (!Is.number(info.dev) || !Is.number(info.ino)) return undefined;
  return { dev: info.dev, ino: info.ino };
}

async function lstatRequired(
  io: Io,
  path: string,
  operation: t.FsRooted.Operation,
  kind: 'invalid-root' | 'unsafe-filesystem',
): Promise<Deno.FileInfo> {
  const info = await lstatMaybe(io, path, operation);
  if (!info) throw failure(operation, kind);
  return info;
}

function validateSegment(segment: string): void {
  const lower = segment.toLowerCase();
  if (
    !segment ||
    segment.endsWith('.') ||
    segment.endsWith(' ') ||
    CONTROL.test(segment) ||
    RESERVED.test(segment) ||
    DEVICE.test(segment) ||
    lower.startsWith(INTERNAL_NAME)
  ) {
    throw failure('admit', 'invalid-target');
  }
}

function ancestorChain(path: string): readonly string[] {
  const chain: string[] = [];
  let current = StdPath.resolve(path);
  while (true) {
    chain.unshift(current);
    const parent = StdPath.dirname(current);
    if (parent === current) return chain;
    current = parent;
  }
}

function compare(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
