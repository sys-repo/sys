import { Pkg } from '@sys/std/pkg';
import { Hash, Is, Json, Obj, Rx, type t } from '../common.ts';
import {
  checkCancelled,
  DEFAULT_IO,
  failure,
  ioFailure,
  isFailure,
  type PinnedIo,
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
  resolveRoot,
} from './u.pinned.tree.ts';

const decoder = new TextDecoder('utf-8', { fatal: true });

const PINNED_KEYS = ['dir', 'integrity', 'limits', 'until'] as const;
const PINNED_REQUIRED_KEYS = ['dir', 'integrity', 'limits'] as const;
const LOCAL_KEYS = ['dir', 'limits', 'until'] as const;
const LOCAL_REQUIRED_KEYS = ['dir', 'limits'] as const;
const LIMIT_KEYS = ['manifestBytes', 'entries', 'fileBytes', 'totalBytes'] as const;

/** Exact pinned generation verification. */
export const verifyPinned: t.Pkg.Dist.Pinned.Verify.Method = (args) => {
  return verifyPinnedWithIo(args, DEFAULT_IO);
};

/** Exact local generation verification. */
export const verifyLocal: t.Pkg.Dist.Local.Verify.Method = (args) => {
  return verifyLocalWithIo(args, DEFAULT_IO);
};

/** Internal implementation seam with injectable host IO for deterministic tests. */
export async function verifyPinnedWithIo(
  args: t.Pkg.Dist.Pinned.Verify.Args,
  io: PinnedIo,
): Promise<t.Pkg.Dist.Pinned.Verify.Result> {
  const input = admitPinnedArgs(args);
  if (!input) return failed('invalid-input');
  const result = await verifyWithIo(input, io);
  return result;
}

/** Internal implementation seam with injectable host IO for deterministic tests. */
export async function verifyLocalWithIo(
  args: t.Pkg.Dist.Local.Verify.Args,
  io: PinnedIo,
): Promise<t.Pkg.Dist.Local.Verify.Result> {
  const input = admitLocalArgs(args);
  if (!input) return failed('invalid-input');
  const result = await verifyWithIo(input, io);
  return result;
}

async function verifyWithIo(
  args: VerifiedArgs,
  io: PinnedIo,
): Promise<t.Pkg.Dist.Verify.Result> {
  let life: ReturnType<typeof Rx.abortable>;
  try {
    life = Rx.abortable(args.until);
  } catch {
    return failed('invalid-input');
  }

  const authority = args.mode === 'pinned' ? args.integrity : undefined;

  try {
    // Pre-ended lifecycle bridges settle asynchronously; observe them before any host operation.
    await Promise.resolve();
    checkCancelled(life.signal);
    const root = await resolveRoot(io, args.dir, life.signal);
    const manifest = await readManifest(
      io,
      root,
      args.limits.manifestBytes,
      life.signal,
    );

    checkCancelled(life.signal);
    const manifestIntegrity = Hash.sha256(manifest.bytes);
    if (args.mode === 'pinned' && manifestIntegrity !== authority) {
      throw failure('integrity-mismatch');
    }

    let parsed: unknown;
    try {
      const text = decoder.decode(manifest.bytes);
      parsed = Json.parse<unknown>(text);
    } catch {
      throw failure('malformed');
    }
    const strict = await admitManifest(parsed, args.limits);
    checkCancelled(life.signal);

    const before = await observeTree(io, root, args.limits.entries, life.signal, {
      expected: { path: 'dist.json', metadata: manifest.metadata },
    });
    assertObserved(manifest.metadata, observedFile(before, 'dist.json', 'changed'));
    assertExactTree(before, strict.parts);

    let totalBytes = 0;
    let packageBytes = 0;
    for (const part of strict.parts) {
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
      totalBytes !== strict.dist.build.size.total ||
      packageBytes !== strict.dist.build.size.pkg
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
    if (Hash.sha256(finalManifest.bytes) !== (authority ?? manifestIntegrity)) {
      throw failure('changed');
    }
    checkCancelled(life.signal);

    const assets = Object.freeze({
      files: strict.parts.length,
      totalBytes,
      packageBytes,
    });
    const evidence: t.Pkg.Dist.Verify.Evidence = Object.freeze({
      integrity: authority ?? manifestIntegrity,
      dist: strict.dist,
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
  const args = admitBaseArgs(input, PINNED_KEYS, PINNED_REQUIRED_KEYS);
  if (!args) return undefined;

  const rawIntegrity = (input as { integrity?: unknown }).integrity;
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
  const args = admitBaseArgs(input, LOCAL_KEYS, LOCAL_REQUIRED_KEYS);
  if (!args) return undefined;

  return Object.freeze({
    ...args,
    mode: 'local',
  });
}

function admitBaseArgs(
  input: unknown,
  allowedKeys: readonly string[],
  requiredKeys: readonly string[],
): VerifiedBase | undefined {
  try {
    if (!isExactPlainDataObject(input, allowedKeys, requiredKeys)) return undefined;

    const values = input as Partial<
      t.Pkg.Dist.Verify.Args & { until?: unknown } & Record<string, unknown>
    >;
    const { dir, limits, until } = values;
    if (!Is.str(dir) || dir.length === 0 || dir.includes('\0')) return undefined;
    if (!Is.untilInput(until)) return undefined;
    if (!isExactPlainDataObject(limits, LIMIT_KEYS, LIMIT_KEYS)) return undefined;

    const manifestBytes = limits.manifestBytes;
    const entries = limits.entries;
    const fileBytes = limits.fileBytes;
    const totalBytes = limits.totalBytes;

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

    return Object.freeze({
      dir,
      limits: Object.freeze(admissible),
      until,
    });
  } catch {
    return undefined;
  }
}

function isExactPlainDataObject(
  input: unknown,
  allowedKeys: readonly string[],
  requiredKeys: readonly string[],
): input is Record<string, unknown> {
  if (!Is.object(input)) return false;

  const keys = Reflect.ownKeys(input);
  for (const key of keys) {
    if (!Is.str(key) || !allowedKeys.includes(key)) return false;
    const descriptor = Object.getOwnPropertyDescriptor(input, key);
    if (!descriptor || descriptor.get !== undefined || descriptor.set !== undefined) return false;
  }

  if (!Is.plainObject(input)) return false;
  if (Object.getPrototypeOf(input) !== Object.prototype) return false;
  for (const key of requiredKeys) {
    if (!Obj.hasOwn(input, key)) return false;
  }
  return true;
}

function failed(
  kind: t.Pkg.Dist.Verify.FailureKind,
): t.Pkg.Dist.Verify.Failure {
  return Object.freeze({ kind });
}

type VerifyMode = 'pinned' | 'local';

type VerifiedBase = {
  readonly dir: t.StringPath;
  readonly limits: t.Pkg.Dist.Verify.Limits;
  readonly until?: t.UntilInput;
};

type VerifiedArgs =
  & VerifiedBase
  & ({ readonly mode: 'pinned'; readonly integrity: t.StringHash } | {
    readonly mode: 'local';
  });
