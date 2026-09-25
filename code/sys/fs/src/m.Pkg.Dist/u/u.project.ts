import { Rooted } from '../../m.Fs.capability/m.Rooted/mod.ts';
import { createRooted } from '../../m.Fs.capability/m.Rooted/u/u.create.ts';
import type { Identity, Io as RootedIo } from '../../m.Fs.capability/m.Rooted/t.internal.ts';
import { DEFAULT_IO as ROOTED_IO } from '../../m.Fs.capability/m.Rooted/u/u.io.ts';
import { identityRequired, sameIdentity } from '../../m.Fs.capability/m.Rooted/u/u.path.ts';
import { Arr, Is, Json, Obj, Path, Pkg, Rx, ServerIs, type t } from '../common.ts';
import { snapshotExactDataObject } from '../u.verify/u.input.ts';
import type { VerifyIo } from '../t.internal.ts';
import { checkCancelled, DEFAULT_IO, failure, ioFailure } from '../u.verify/u.io.ts';
import { addBytes } from '../u.verify/u.limit.ts';
import { readPinnedPartWithIo } from '../u.verify/u.part.ts';
import { resolveRoot } from '../u.verify/u.tree.ts';
import { verifyPinnedWithIo } from '../u.verify/u.verify.ts';
import { batchInput, batchUntil, memberDir, namedData } from './u.batch.ts';
import { compute } from './u.compute.ts';

type Part = { readonly path: string; readonly checksum: string; readonly size: number };
type Output<N extends string> = { readonly name: N; readonly dir: string };
type Projection<N extends string> = Output<N> & { readonly parts: readonly Part[] };
type ActiveStage<N extends string> = {
  readonly name: N;
  readonly stage: t.FsRooted.Stage;
  /** Publication is known or cannot be excluded; discarding the stage cannot erase that evidence. */
  mayBePublished: boolean;
};

/**
 * Copy selected files from a pinned source into new, verified distributions.
 */
export const project: t.Pkg.Dist.Project.Method = (args) =>
  projectWithIo(args, DEFAULT_IO, ROOTED_IO);

/** Projection implementation with injectable filesystem operations. */
export async function projectWithIo<N extends string>(
  args: t.Pkg.Dist.Project.Args<N>,
  io: VerifyIo,
  rootedIo: RootedIo,
): Promise<t.Pkg.Dist.Project.Result<N>> {
  // This coordinator alone owns failure attribution, stage settlement, and the operation lifetime.
  let phase: t.Pkg.Dist.Project.Failure<N>['phase'] = 'input';
  let output: N | undefined;
  let reason: t.Pkg.Dist.Project.Failure<N>['reason'] | undefined;
  let cleanup: t.FsRooted.FailureKind | undefined;
  let life: t.Abortable | undefined;
  let rooted: t.FsRooted.Instance | undefined;
  let active: ActiveStage<N> | undefined;
  const remaining = new Set<N>();

  try {
    const captured = captureInput(args);
    const { root, source, outputs, limits, batch, select, pkg, builder, until } = captured;
    try {
      life = Rx.abortable(until);
    } catch {
      throw failure('invalid-input');
    }
    await Promise.resolve();
    checkCancelled(life.signal);

    phase = 'source';
    const sourceArgs = { ...source, limits, until: life.signal };
    const sourceRoot = await resolveRoot(io, sourceArgs.dir, life.signal);
    const verified = await verifyPinnedWithIo(sourceArgs, io);
    if (verified.kind !== 'verified') throw failure(verified.kind);
    const sourceDist = verified.evidence.dist;

    phase = 'select';
    let selected: unknown;
    try {
      selected = select(sourceDist);
    } catch {
      reason = 'policy-failure';
      throw failure('invalid-input');
    }
    const projections = captureSelection(outputs, selected, sourceDist, batch.totalBytes);
    checkCancelled(life.signal);

    phase = 'output';
    rooted = await createRooted({ root, create: false, until: life.signal }, rootedIo);
    const admission = await rooted.Target.admit(
      projections.map(({ dir }) => ({ kind: 'directory', path: dir })),
      { until: life.signal },
    );
    // Admit every destination before staging any output; promotion checks occupancy again.
    const resolvedPaths: string[] = [sourceRoot.path];
    for (const { name, dir } of projections) {
      output = name;
      const destination = Path.join(rooted.path, dir);
      const parent = await resolveRoot(io, Path.dirname(destination), life.signal);
      await assertOutsideSource(io, parent.path, sourceRoot.metadata.identity, life.signal);
      resolvedPaths.push(Path.join(parent.path, Path.basename(destination)));
      try {
        await io.lstat(destination);
        reason = 'occupied';
        throw failure('content-mismatch');
      } catch (cause) {
        if (!(cause instanceof Deno.errors.NotFound)) throw cause;
      }
    }
    assertDisjoint(resolvedPaths);

    // One active stage at a time. Earlier published outputs are never rolled back.
    const pins: [N, t.DistPin][] = [];
    for (const [outputIndex, projection] of projections.entries()) {
      const { name, parts } = projection;
      output = name;
      checkCancelled(life.signal);
      // Creation can leave a container even when it returns no handle or cleanup error.
      remaining.add(name);
      const stage = await rooted.Stage.create({ until: life.signal });
      active = { name, stage, mayBePublished: false };

      const files = await stage.files.Target.admit([
        ...parts.map(({ path }) => ({ kind: 'file' as const, path })),
        { kind: 'file', path: 'dist.json' },
      ], { until: life.signal });
      for (const [fileIndex, part] of parts.entries()) {
        const read = await readPinnedPartWithIo({
          dir: sourceArgs.dir,
          ...part,
          until: life.signal,
        }, io);
        if (read.kind !== 'read') throw failure(read.kind);
        await stage.files.File.publish(files.targets[fileIndex], read.bytes, {
          until: life.signal,
        });
      }

      let computed: t.Pkg.Dist.Compute.Response;
      try {
        computed = await compute({ dir: stage.path, pkg, builder });
        if (computed.error || !computed.exists) throw failure('io-failure');
      } catch {
        reason = 'compute-failure';
        throw failure('io-failure');
      }
      checkCancelled(life.signal);
      const bytes = new TextEncoder().encode(Json.stringify(computed.dist, 2));
      if (bytes.byteLength > limits.manifestBytes) throw failure('limit-exceeded');
      await stage.files.File.publish(files.targets[parts.length], bytes, { until: life.signal });
      const checked = await verifyPinnedWithIo({
        dir: stage.path,
        integrity: computed.manifest.integrity,
        limits,
        until: life.signal,
      }, io);
      if (checked.kind !== 'verified') throw failure(checked.kind);
      const actual = checked.evidence.dist.hash.parts;
      if (
        Object.keys(actual).length !== parts.length ||
        parts.some(({ path }) => actual[path] !== sourceDist.hash.parts[path])
      ) throw failure('content-mismatch');

      try {
        const promoted = await rooted.Stage.promote(stage, admission.targets[outputIndex], {
          until: life.signal,
        });
        if (promoted.kind === 'occupied') {
          reason = 'occupied';
          cleanup = promoted.cleanupError?.kind;
          throw failure('content-mismatch');
        }
        active.mayBePublished = true;
        if (promoted.cleanupError) {
          phase = 'cleanup';
          throw promoted.cleanupError;
        }
      } catch (cause) {
        if (Rooted.Is.failure(cause) && cause.committed) active.mayBePublished = true;
        throw cause;
      }
      pins.push([name, Object.freeze({ 'dist.json': checked.evidence.integrity })]);
      active = undefined;
    }

    output = undefined;
    phase = 'recheck';
    const rechecked = await verifyPinnedWithIo(sourceArgs, io);
    if (rechecked.kind !== 'verified') throw failure(rechecked.kind);
    checkCancelled(life.signal);
    return Object.freeze({
      kind: 'projected',
      pins: Object.freeze(Object.fromEntries(pins)) as Readonly<Record<N, t.DistPin>>,
    });
  } catch (cause) {
    const error = Rooted.Is.failure(cause) ? cause : ioFailure(cause);
    reason ??= error.kind;
    if (Rooted.Is.failure(cause)) cleanup ??= cause.cleanupError?.kind;
    if (active && rooted) {
      try {
        // Cleanup is attempted after cancellation too; only proven-unpublished residue can clear.
        await rooted.Stage.discard(active.stage);
        if (!active.mayBePublished) remaining.delete(active.name);
      } catch (cause) {
        cleanup ??= Rooted.Is.failure(cause) ? cause.kind : 'io-failure';
      }
    }
    return Object.freeze({
      kind: 'failed',
      phase,
      reason,
      ...(output === undefined ? {} : { output }),
      remaining: Object.freeze([...remaining]),
      ...(cleanup === undefined ? {} : { cleanup }),
    });
  } finally {
    life?.dispose();
  }
}

/**
 * Admission helpers: synchronous snapshots, with no filesystem effects.
 */
function captureInput<N extends string>(args: t.Pkg.Dist.Project.Args<N>) {
  const values = snapshotExactDataObject(args, {
    ALLOWED: ['root', 'source', 'outputs', 'limits', 'batch', 'select', 'pkg', 'builder', 'until'],
    REQUIRED: ['root', 'source', 'outputs', 'limits', 'batch', 'select'],
  });
  if (!values) throw failure('invalid-input');
  const source = snapshotExactDataObject(values.source, {
    ALLOWED: ['dir', 'integrity'],
    REQUIRED: ['dir', 'integrity'],
  });
  if (!source || !Pkg.Is.distPin({ 'dist.json': source.integrity }) || !Is.str(source.integrity)) {
    throw failure('invalid-input');
  }
  const sourceDir = memberDir(source.dir);
  const rawOutputs = namedData(values.outputs);
  const names = Object.keys(rawOutputs).sort() as N[];
  if (names.length === 0 || !Is.func(values.select)) throw failure('invalid-input');
  const select = values.select;
  const { root, limits, batch } = batchInput(values);
  if (names.length > batch.inventories) throw failure('limit-exceeded');
  const outputs: Output<N>[] = names.map((name) => ({ name, dir: memberDir(rawOutputs[name]) }));
  const sourcePath = Path.join(root, sourceDir);
  assertDisjoint([sourcePath, ...outputs.map(({ dir }) => Path.join(root, dir))]);
  const pkg = capturePkg(values.pkg);
  const builder = capturePkg(values.builder);
  // Lifecycle validation may invoke getters; every other input is already captured.
  const until = batchUntil(values.until);
  return {
    root,
    source: { dir: sourcePath, integrity: source.integrity },
    outputs: Object.freeze(outputs),
    limits,
    batch,
    select,
    pkg,
    builder,
    until,
  } as const;
}

/** Capture exact payload selections and charge every copy before any output IO. */
function captureSelection<N extends string>(
  outputs: readonly Output<N>[],
  selected: unknown,
  dist: t.DeepReadonly<t.DistPkg>,
  totalBytes: number,
): readonly Projection<N>[] {
  const selections = namedData(selected);
  const names = outputs.map(({ name }) => name);
  if (!Arr.equal(Object.keys(selections).sort(), names)) throw failure('invalid-input');
  const projections: Projection<N>[] = [];
  let total = 0;
  for (const output of outputs) {
    const paths = selections[output.name];
    if (
      ServerIs.Native.proxy(paths) || !Is.array(paths) ||
      Object.getPrototypeOf(paths) !== Array.prototype || paths.length === 0 ||
      paths.length > Object.keys(dist.hash.parts).length ||
      Reflect.ownKeys(paths).length !== paths.length + 1
    ) throw failure('invalid-input');
    const parts: Part[] = [];
    const seen = new Set<string>();
    // Inspect array slots so getters and custom iterators cannot supply paths.
    for (let index = 0; index < paths.length; index++) {
      const property = Object.getOwnPropertyDescriptor(paths, String(index));
      if (!property || !Obj.hasOwn(property, 'value')) throw failure('invalid-input');
      const path = property.value;
      if (
        !Is.str(path) || path === 'dist.json' || seen.has(path) ||
        !Obj.hasOwn(dist.hash.parts, path)
      ) throw failure('invalid-input');
      seen.add(path);
      const part = Pkg.Dist.Part.parse(dist.hash.parts[path]);
      if (!part || part.size === undefined) throw failure('malformed');
      total = addBytes(total, part.size, totalBytes);
      parts.push(Object.freeze({ path, checksum: part.hash, size: part.size }));
    }
    projections.push(Object.freeze({ ...output, parts: Object.freeze(parts) }));
  }
  return Object.freeze(projections);
}

/** Reject equal or nested roots by their resolved spelling. */
function assertDisjoint(paths: readonly string[]): void {
  for (const [index, path] of paths.entries()) {
    if (
      paths.slice(index + 1).some((other) =>
        Path.Is.within(path, other) || Path.Is.within(other, path)
      )
    ) throw failure('unsafe-path');
  }
}

/** Compare directory identities too: realpath need not normalize case or Unicode spelling. */
async function assertOutsideSource(
  io: VerifyIo,
  parent: string,
  source: Identity,
  signal: AbortSignal,
): Promise<void> {
  let current = parent;
  while (true) {
    checkCancelled(signal);
    const info = await io.lstat(current);
    if (info.isSymlink) throw failure('symlink');
    if (!info.isDirectory) throw failure('unsafe-path');
    const identity = identityRequired(info, 'admit');
    if (sameIdentity(source, identity)) throw failure('unsafe-path');
    const next = Path.dirname(current);
    if (next === current) return;
    current = next;
  }
}

function capturePkg(input: unknown): t.Pkg | undefined {
  if (input === undefined) return;
  const value = snapshotExactDataObject(input, {
    ALLOWED: ['name', 'version'],
    REQUIRED: ['name', 'version'],
  });
  if (!value || !Is.str(value.name) || !Is.str(value.version)) throw failure('invalid-input');
  return Object.freeze({ name: value.name, version: value.version });
}
