import { Obj, Path, Pkg, Rx, type t } from './common.ts';
import { batchInput, batchUntil, memberDir, namedData } from './u/u.batch.ts';
import { snapshotExactDataObject } from './u.verify/u.input.ts';
import type { VerifyIo } from './t.internal.ts';
import { checkCancelled, DEFAULT_IO, failure, ioFailure } from './u.verify/u.io.ts';
import { verifyPinnedWithIo } from './u.verify/u.verify.ts';

/**
 * Verify all distributions in a selection against their manifest pins.
 */
export const Pins: t.Pkg.Dist.Pins.Lib = Object.freeze({
  ...Pkg.Dist.Pins,
  verify: (args) => verifyPinsWithIo(args, DEFAULT_IO),
});

/** Verification implementation with injectable filesystem reads. */
export async function verifyPinsWithIo<N extends string>(
  args: t.Pkg.Dist.Pins.Args<N>,
  io: VerifyIo,
): Promise<t.Pkg.Dist.Pins.Result<N>> {
  let life: t.Abortable | undefined;
  let name: N | undefined;
  try {
    const values = snapshotExactDataObject(args, {
      ALLOWED: ['root', 'selection', 'dirs', 'limits', 'batch', 'until'],
      REQUIRED: ['root', 'selection', 'dirs', 'limits', 'batch'],
    });
    if (!values) throw failure('invalid-input');
    let selection: t.DistPins;
    try {
      // Check for proxies here; the shared capture function must also work in browsers.
      const data = namedData(values.selection);
      const pins = namedData(data.pins);
      selection = Pkg.Dist.Pins.capture({
        ...data,
        pins: Object.fromEntries(Object.keys(pins).map((key) => [key, namedData(pins[key])])),
      });
    } catch {
      throw failure('invalid-input');
    }
    const rawDirs = namedData(values.dirs);
    const { root, limits, batch } = batchInput(values);
    const names = Object.keys(selection.pins).sort() as N[];
    if (
      Object.keys(rawDirs).length !== names.length || names.some((key) => !Obj.hasOwn(rawDirs, key))
    ) {
      throw failure('invalid-input');
    }
    if (names.length > batch.inventories) throw failure('limit-exceeded');
    const dirs = new Map(names.map((key) => [key, Path.join(root, memberDir(rawDirs[key]))]));
    const until = batchUntil(values.until);
    try {
      life = Rx.abortable(until);
    } catch {
      throw failure('invalid-input');
    }
    await Promise.resolve();
    checkCancelled(life.signal);
    let remaining = batch.totalBytes;
    const entries: [N, t.Pkg.Dist.Verify.Evidence][] = [];
    for (const key of names) {
      name = key;
      const result = await verifyPinnedWithIo({
        dir: dirs.get(key),
        integrity: selection.pins[key]['dist.json'],
        limits: { ...limits, totalBytes: Math.min(limits.totalBytes, remaining) },
        until: life.signal,
      }, io);
      if (result.kind !== 'verified') return Object.freeze({ kind: result.kind, name });
      remaining -= result.evidence.assets.totalBytes;
      entries.push([key, result.evidence]);
    }
    checkCancelled(life.signal);
    const evidence = Object.freeze(Object.fromEntries(entries)) as Readonly<
      Record<N, t.Pkg.Dist.Verify.Evidence>
    >;
    return Object.freeze({ kind: 'verified', evidence });
  } catch (cause) {
    const kind = ioFailure(cause).kind;
    return Object.freeze({ kind, ...(name === undefined ? {} : { name }) });
  } finally {
    life?.dispose();
  }
}
