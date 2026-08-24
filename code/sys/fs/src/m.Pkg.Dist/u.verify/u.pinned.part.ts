import { normalizeTargets } from '../../m.Fs.capability/m.Rooted/u/u.target.ts';
import { Hash, Is, Path, Pkg, Rx, type t } from '../common.ts';
import { snapshotExactDataObject, snapshotUntilInput } from './u.input.ts';
import {
  checkCancelled,
  DEFAULT_IO,
  failure,
  ioFailure,
  isFailure,
  type VerifyIo,
} from './u.pinned.io.ts';
import { isSafeNonNegative } from './u.pinned.limit.ts';
import {
  observePartAncestors,
  readRegularFile,
  resolveLocalRoot,
  resolveRoot,
} from './u.pinned.tree.ts';

type ReadMode = 'local' | 'pinned';
type ReadArgs = Omit<t.Pkg.Dist.Pinned.ReadPart.Args, 'dir'> & {
  readonly dir: t.StringAbsoluteDir;
};

const KEYS = {
  ALLOWED: ['dir', 'path', 'checksum', 'size', 'until'],
  REQUIRED: ['dir', 'path', 'checksum', 'size'],
} as const;

/** Read one exact checksum-pinned distribution part. */
export const readPinnedPart: t.Pkg.Dist.Pinned.ReadPart.Method = (args) => {
  return readPartWithIo(args, DEFAULT_IO, 'pinned');
};

/** Read one checksum-matched file using a root resolved for this call. */
export const readLocalPart: t.Pkg.Dist.Local.ReadPart.Method = (args) => {
  return readPartWithIo(args, DEFAULT_IO, 'local');
};

/** Internal pinned-read implementation seam with injectable host IO. */
export function readPinnedPartWithIo(
  input: unknown,
  io: VerifyIo,
): Promise<t.Pkg.Dist.Pinned.ReadPart.Result> {
  return readPartWithIo(input, io, 'pinned');
}

/** Internal local-read implementation seam with injectable host IO. */
export function readLocalPartWithIo(
  input: unknown,
  io: VerifyIo,
): Promise<t.Pkg.Dist.Local.ReadPart.Result> {
  return readPartWithIo(input, io, 'local');
}

/**
 * Helpers:
 */
async function readPartWithIo(
  input: unknown,
  io: VerifyIo,
  mode: ReadMode,
): Promise<t.Pkg.Dist.Pinned.ReadPart.Result> {
  const args = admitArgs(input);
  if (!args) return failed('invalid-input');

  let life: ReturnType<typeof Rx.abortable>;
  try {
    life = Rx.abortable(args.until);
  } catch {
    return failed('invalid-input');
  }

  try {
    // Pre-ended lifecycle bridges settle asynchronously; observe them before any host operation.
    await Promise.resolve();
    checkCancelled(life.signal);
    const root = mode === 'local'
      ? await resolveLocalRoot(io, args.dir, life.signal)
      : await resolveRoot(io, args.dir, life.signal);
    const ancestors = await observePartAncestors(io, root, args.path, life.signal);
    const value = await readRegularFile(io, root, args.path, args.size, life.signal, {
      exactSize: args.size,
      missing: 'missing',
      wrongKind: 'content-mismatch',
    });
    await observePartAncestors(io, root, args.path, life.signal, ancestors);

    checkCancelled(life.signal);
    const checksum = Hash.sha256(value.bytes);
    checkCancelled(life.signal);
    if (checksum !== args.checksum) throw failure('content-mismatch');

    return Object.freeze({ kind: 'read', bytes: value.bytes });
  } catch (cause) {
    const error = isFailure(cause) ? cause : ioFailure(cause);
    return failed(toPartFailureKind(error.kind));
  } finally {
    life.dispose();
  }
}

function admitArgs(input: unknown): ReadArgs | undefined {
  try {
    const values = snapshotExactDataObject(input, KEYS);
    if (!values) return undefined;

    const { dir, path, checksum, size, until } = values;
    if (!Is.str(dir) || dir.length === 0 || dir.includes('\0')) return undefined;
    if (!Is.str(path)) return undefined;
    if (!Is.str(checksum)) return undefined;
    if (!isSafeNonNegative(size)) return undefined;
    const absoluteDir = Path.resolve(dir) as t.StringAbsoluteDir;

    const parsed = Pkg.Dist.Part.parse(checksum);
    if (!parsed || parsed.hash !== checksum || parsed.size !== undefined) return undefined;

    const normalized = normalizeTargets([{ kind: 'file', path }]);
    const target = normalized[0];
    if (!target || target.path !== path) return undefined;

    const untilSnapshot = snapshotUntilInput(until);
    if (!untilSnapshot) return undefined;

    return Object.freeze({
      dir: absoluteDir,
      path: target.path,
      checksum: parsed.hash,
      size,
      until: untilSnapshot.value,
    });
  } catch {
    return undefined;
  }
}

/** Keep verifier-only grammar out of this narrower public operation. */
function toPartFailureKind(
  kind: t.Pkg.Dist.Verify.FailureKind,
): t.Pkg.Dist.Pinned.ReadPart.FailureKind {
  switch (kind) {
    case 'malformed':
    case 'integrity-mismatch':
    case 'unexpected-entry':
      // Unreachable for admitted part reads; fail closed if the shared kernel ever emits one.
      return 'io-failure';
    default:
      return kind;
  }
}

function failed(
  kind: t.Pkg.Dist.Pinned.ReadPart.FailureKind,
): t.Pkg.Dist.Pinned.ReadPart.Failure {
  return Object.freeze({ kind });
}
