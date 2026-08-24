import { Pkg } from '@sys/std/pkg';
import { Hash, Is, Json, Path, Rx, type t } from '../common.ts';
import { snapshotExactDataObject, snapshotUntilInput } from './u.input.ts';
import {
  checkCancelled,
  DEFAULT_IO,
  failure,
  ioFailure,
  isFailure,
  type VerifyIo,
} from './u.pinned.io.ts';
import { addBytes, isSafeNonNegative, isSafePositive } from './u.pinned.limit.ts';
import { admitManifest } from './u.pinned.manifest.ts';
import {
  assertExactTree,
  assertObserved,
  assertUnchanged,
  bytesEqual,
  observedFile,
  observeTree,
  readAsset,
  readManifest,
  resolveLocalRoot,
  resolveRoot,
} from './u.pinned.tree.ts';

type VerifiedBase = {
  readonly dir: t.StringAbsoluteDir;
  readonly limits: t.Pkg.Dist.Verify.Limits;
  readonly until?: t.UntilInput;
};

type VerifiedArgs =
  & VerifiedBase
  & ({ readonly mode: 'pinned'; readonly integrity: t.StringHash } | { readonly mode: 'local' });

const decoder = new TextDecoder('utf-8', { fatal: true });

const KEYS = {
  PINNED: {
    ALLOWED: ['dir', 'integrity', 'limits', 'until'],
    REQUIRED: ['dir', 'integrity', 'limits'],
  },
  LOCAL: {
    ALLOWED: ['dir', 'limits', 'until'],
    REQUIRED: ['dir', 'limits'],
  },
  LIMITS: {
    ALLOWED: ['manifestBytes', 'entries', 'fileBytes', 'totalBytes'],
    REQUIRED: ['manifestBytes', 'entries', 'fileBytes', 'totalBytes'],
  },
} as const;

/**
 * Exact pinned distribution verification.
 */
export const verifyPinned: t.Pkg.Dist.Pinned.Verify.Method = (args) => {
  return verifyPinnedWithIo(args, DEFAULT_IO);
};

/**
 * Exact local distribution verification.
 */
export const verifyLocal: t.Pkg.Dist.Local.Verify.Method = (args) => {
  return verifyLocalWithIo(args, DEFAULT_IO);
};

/** Internal implementation seam with injectable host IO for deterministic tests. */
export async function verifyPinnedWithIo(
  args: unknown,
  io: VerifyIo,
): Promise<t.Pkg.Dist.Pinned.Verify.Result> {
  const input = admitPinnedArgs(args);
  if (!input) return failed('invalid-input');
  const result = await verifyWithIo(input, io);
  return result;
}

/** Internal implementation seam with injectable host IO for deterministic tests. */
export async function verifyLocalWithIo(
  args: unknown,
  io: VerifyIo,
): Promise<t.Pkg.Dist.Local.Verify.Result> {
  const input = admitLocalArgs(args);
  if (!input) return localFailed('invalid-input');

  const result = await verifyWithIo(input, io);
  if (result.kind === 'verified') return result;
  // Local mode has no caller pin; fail closed if the shared kernel ever violates that grammar.
  if (result.kind === 'integrity-mismatch') return localFailed('io-failure');
  return localFailed(result.kind);
}

/**
 * Helpers:
 */
async function verifyWithIo(
  args: VerifiedArgs,
  io: VerifyIo,
): Promise<t.Pkg.Dist.Verify.Result> {
  let life: ReturnType<typeof Rx.abortable>;
  try {
    life = Rx.abortable(args.until);
  } catch {
    return failed('invalid-input');
  }

  const expectedManifestChecksum = args.mode === 'pinned' ? args.integrity : undefined;

  try {
    // Pre-ended lifecycle bridges settle asynchronously; observe them before any host operation.
    await Promise.resolve();
    checkCancelled(life.signal);
    const root = args.mode === 'local'
      ? await resolveLocalRoot(io, args.dir, life.signal)
      : await resolveRoot(io, args.dir, life.signal);
    const manifest = await readManifest(
      io,
      root,
      args.limits.manifestBytes,
      life.signal,
    );

    checkCancelled(life.signal);
    const manifestIntegrity = Hash.sha256(manifest.bytes);
    if (args.mode === 'pinned' && manifestIntegrity !== expectedManifestChecksum) {
      throw failure('integrity-mismatch');
    }

    let parsed: unknown;
    try {
      const text = decoder.decode(manifest.bytes);
      parsed = Json.parse<unknown>(text);
    } catch {
      throw failure('malformed');
    }
    const admitted = await admitManifest(parsed, args.limits);
    checkCancelled(life.signal);

    const before = await observeTree(io, root, args.limits.entries, life.signal, {
      expected: { path: 'dist.json', metadata: manifest.metadata },
    });
    assertObserved(manifest.metadata, observedFile(before, 'dist.json', 'changed'));
    assertExactTree(before, admitted.parts);

    let totalBytes = 0;
    let packageBytes = 0;
    for (const part of admitted.parts) {
      checkCancelled(life.signal);
      const observed = observedFile(before, part.path);
      const value = await readAsset(
        io,
        root,
        part,
        observed,
        args.limits.fileBytes,
        life.signal,
      );
      checkCancelled(life.signal);
      const hash = Hash.sha256(value.bytes);
      checkCancelled(life.signal);
      if (hash !== part.hash) throw failure('content-mismatch');

      totalBytes = addBytes(totalBytes, value.bytes.byteLength, args.limits.totalBytes);
      if (Pkg.Dist.Is.codePath(part.path)) {
        packageBytes = addBytes(packageBytes, value.bytes.byteLength, args.limits.totalBytes);
      }
    }

    if (
      totalBytes !== admitted.dist.build.size.total ||
      packageBytes !== admitted.dist.build.size.pkg
    ) {
      throw failure('content-mismatch');
    }

    const after = await observeTree(io, root, args.limits.entries, life.signal, {
      transitionKind: 'changed',
    });
    assertUnchanged(before, after);

    const finalManifest = await readManifest(
      io,
      root,
      args.limits.manifestBytes,
      life.signal,
      manifest.metadata,
    );
    if (!bytesEqual(manifest.bytes, finalManifest.bytes)) throw failure('changed');
    checkCancelled(life.signal);
    if (
      Hash.sha256(finalManifest.bytes) !== (expectedManifestChecksum ?? manifestIntegrity)
    ) {
      throw failure('changed');
    }
    checkCancelled(life.signal);

    const assets = Object.freeze({
      files: admitted.parts.length,
      totalBytes,
      packageBytes,
    });
    const evidence: t.Pkg.Dist.Verify.Evidence = Object.freeze({
      integrity: expectedManifestChecksum ?? manifestIntegrity,
      dist: admitted.dist,
      manifestBytes: manifest.bytes.byteLength,
      assets,
    });
    return Object.freeze({ kind: 'verified', evidence });
  } catch (cause) {
    const error = isFailure(cause) ? cause : ioFailure(cause);
    return failed(error.kind);
  } finally {
    life.dispose();
  }
}

function admitPinnedArgs(input: unknown): VerifiedArgs | undefined {
  const values = snapshotExactDataObject(input, KEYS.PINNED);
  if (!values) return undefined;

  const args = admitBaseArgs(values);
  if (!args) return undefined;

  const rawIntegrity = values.integrity;
  if (!Is.str(rawIntegrity) || rawIntegrity.length === 0) return undefined;

  const parsed = Pkg.Dist.Part.parse(rawIntegrity);
  if (!parsed || parsed.hash !== rawIntegrity || parsed.size !== undefined) return undefined;

  return Object.freeze({
    ...args,
    integrity: rawIntegrity,
    mode: 'pinned',
  });
}

function admitLocalArgs(input: unknown): VerifiedArgs | undefined {
  const values = snapshotExactDataObject(input, KEYS.LOCAL);
  if (!values) return undefined;

  const args = admitBaseArgs(values);
  if (!args) return undefined;

  return Object.freeze({
    ...args,
    mode: 'local',
  });
}

function admitBaseArgs(values: Readonly<Record<string, unknown>>): VerifiedBase | undefined {
  try {
    const { dir, limits, until } = values;
    if (!Is.str(dir) || dir.length === 0 || dir.includes('\0')) return undefined;
    const absoluteDir = Path.resolve(dir) as t.StringAbsoluteDir;

    const admittedLimits = snapshotExactDataObject(limits, KEYS.LIMITS);
    if (!admittedLimits) return undefined;

    const { manifestBytes, entries, fileBytes, totalBytes } = admittedLimits;
    if (
      !isSafePositive(manifestBytes) ||
      !isSafePositive(entries) ||
      !isSafeNonNegative(fileBytes) ||
      !isSafeNonNegative(totalBytes)
    ) {
      return undefined;
    }

    const admissible = {
      manifestBytes,
      entries,
      fileBytes,
      totalBytes,
    };
    const untilSnapshot = snapshotUntilInput(until);
    if (!untilSnapshot) return undefined;

    return Object.freeze({
      dir: absoluteDir,
      limits: Object.freeze(admissible),
      until: untilSnapshot.value,
    });
  } catch {
    return undefined;
  }
}

function failed(
  kind: t.Pkg.Dist.Verify.FailureKind,
): t.Pkg.Dist.Verify.Failure {
  return Object.freeze({ kind });
}

function localFailed(
  kind: t.Pkg.Dist.Local.Verify.FailureKind,
): t.Pkg.Dist.Local.Verify.Failure {
  return Object.freeze({ kind });
}
