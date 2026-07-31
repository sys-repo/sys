import { Pkg } from '@sys/std/pkg';
import { Hash, Is, Json, Rx, type t } from '../common.ts';
import {
  checkCancelled,
  DEFAULT_IO,
  failure,
  ioFailure,
  isFailure,
  type VerifyPinnedIo,
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

/** Exact pinned generation verification. */
export const verifyPinned: t.Pkg.Dist.VerifyPinned.Method = (args) => {
  return verifyPinnedWithIo(args, DEFAULT_IO);
};

/** Internal implementation seam with injectable host IO for deterministic tests. */
export async function verifyPinnedWithIo(
  args: t.Pkg.Dist.VerifyPinned.Args,
  io: VerifyPinnedIo,
): Promise<t.Pkg.Dist.VerifyPinned.Result> {
  const input = admitArgs(args);
  if (!input) return failed('invalid-input');

  let life: ReturnType<typeof Rx.abortable>;
  try {
    life = Rx.abortable(input.until);
  } catch {
    return failed('invalid-input');
  }

  try {
    checkCancelled(life.signal);
    const root = await resolveRoot(io, input.dir, life.signal);
    const manifest = await readManifest(
      io,
      root,
      input.limits.manifestBytes,
      life.signal,
    );

    checkCancelled(life.signal);
    const manifestIntegrity = Hash.sha256(manifest.bytes);
    checkCancelled(life.signal);
    if (manifestIntegrity !== input.integrity) throw failure('integrity-mismatch');

    let parsed: unknown;
    try {
      const text = decoder.decode(manifest.bytes);
      parsed = Json.parse<unknown>(text);
    } catch {
      throw failure('malformed');
    }
    const strict = await admitManifest(parsed, input.limits);
    checkCancelled(life.signal);

    const before = await observeTree(io, root, input.limits.entries, life.signal, {
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
        input.limits.fileBytes,
        life.signal,
      );
      checkCancelled(life.signal);
      const hash = Hash.sha256(value.bytes);
      checkCancelled(life.signal);
      if (hash !== part.hash) throw failure('content-mismatch');

      totalBytes = addBytes(totalBytes, value.bytes.byteLength, input.limits.totalBytes);
      if (Pkg.Dist.Is.codePath(part.path)) {
        packageBytes = addBytes(packageBytes, value.bytes.byteLength, input.limits.totalBytes);
      }
    }

    if (
      totalBytes !== strict.dist.build.size.total ||
      packageBytes !== strict.dist.build.size.pkg
    ) {
      throw failure('content-mismatch');
    }

    const after = await observeTree(io, root, input.limits.entries, life.signal, {
      transitionKind: 'changed',
    });
    assertUnchanged(before, after);

    const finalManifest = await readManifest(
      io,
      root,
      input.limits.manifestBytes,
      life.signal,
      manifest.metadata,
    );
    if (!bytesEqual(manifest.bytes, finalManifest.bytes)) throw failure('changed');
    checkCancelled(life.signal);
    if (Hash.sha256(finalManifest.bytes) !== input.integrity) throw failure('changed');
    checkCancelled(life.signal);

    const assets = Object.freeze({
      files: strict.parts.length,
      totalBytes,
      packageBytes,
    });
    const evidence: t.Pkg.Dist.VerifyPinned.Evidence = Object.freeze({
      integrity: input.integrity,
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

function admitArgs(input: unknown): t.Pkg.Dist.VerifyPinned.Args | undefined {
  try {
    if (!Is.plainObject(input)) return undefined;
    const args = input as Partial<t.Pkg.Dist.VerifyPinned.Args>;
    const { dir, integrity, until } = args;
    if (!Is.str(dir) || dir.length === 0 || dir.includes('\0')) return undefined;
    const parsed = Pkg.Dist.Part.parse(integrity);
    if (!parsed || parsed.hash !== integrity || parsed.size !== undefined) return undefined;

    const source = args.limits;
    if (!Is.plainObject(source)) return undefined;
    const limits = {
      manifestBytes: source.manifestBytes,
      entries: source.entries,
      fileBytes: source.fileBytes,
      totalBytes: source.totalBytes,
    };
    if (
      !isSafePositive(limits.manifestBytes) ||
      !isSafePositive(limits.entries) ||
      !isSafeNonNegative(limits.fileBytes) ||
      !isSafeNonNegative(limits.totalBytes)
    ) {
      return undefined;
    }

    return Object.freeze({
      dir,
      integrity,
      limits: Object.freeze(limits),
      until,
    });
  } catch {
    return undefined;
  }
}

function failed(
  kind: t.Pkg.Dist.VerifyPinned.FailureKind,
): t.Pkg.Dist.VerifyPinned.Failure {
  return Object.freeze({ kind });
}
