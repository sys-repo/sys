import { normalizeTargets } from '../../m.Fs.capability/m.Rooted/u/u.target.ts';
import { Hash, Is, Obj, Pkg, Rx, type t } from '../common.ts';
import {
  checkCancelled,
  DEFAULT_IO,
  failure,
  ioFailure,
  isFailure,
  type PinnedIo,
} from './u.pinned.io.ts';
import { isSafeNonNegative } from './u.pinned.limit.ts';
import { observePartAncestors, readRegularFile, resolveRoot } from './u.pinned.tree.ts';

const INPUT_KEYS = ['dir', 'path', 'checksum', 'size', 'until'] as const;
const REQUIRED_KEYS = ['dir', 'path', 'checksum', 'size'] as const;

/** Read one exact checksum-pinned distribution part. */
export const readPinnedPart: t.Pkg.Dist.Pinned.ReadPart.Method = (args) => {
  return readPinnedPartWithIo(args, DEFAULT_IO);
};

/** Internal implementation seam with injectable host IO for deterministic tests. */
export async function readPinnedPartWithIo(
  input: unknown,
  io: PinnedIo,
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
    checkCancelled(life.signal);
    const root = await resolveRoot(io, args.dir, life.signal);
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
    return failed(toPinnedPartFailureKind(error.kind));
  } finally {
    life.dispose();
  }
}

function admitArgs(input: unknown): t.Pkg.Dist.Pinned.ReadPart.Args | undefined {
  try {
    if (!Is.plainObject(input)) return undefined;
    const keys = Reflect.ownKeys(input);
    if (
      keys.some((key) => !Is.str(key) || !INPUT_KEYS.some((name) => name === key)) ||
      REQUIRED_KEYS.some((key) => !Obj.hasOwn(input, key))
    ) {
      return undefined;
    }

    const { dir, path, checksum, size, until } = input;
    if (!Is.str(dir) || dir.length === 0 || dir.includes('\0')) return undefined;
    if (!Is.str(path)) return undefined;
    if (!Is.str(checksum)) return undefined;
    if (!isSafeNonNegative(size)) return undefined;
    if (!Is.untilInput(until)) return undefined;

    const parsed = Pkg.Dist.Part.parse(checksum);
    if (!parsed || parsed.hash !== checksum || parsed.size !== undefined) return undefined;

    const normalized = normalizeTargets([{ kind: 'file', path }]);
    const target = normalized[0];
    if (!target || target.path !== path) return undefined;

    return Object.freeze({
      dir,
      path: target.path,
      checksum: parsed.hash,
      size,
      until,
    });
  } catch {
    return undefined;
  }
}

/** Keep verifier-only grammar out of this narrower public operation. */
function toPinnedPartFailureKind(
  kind: t.Pkg.Dist.Pinned.Verify.FailureKind,
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
