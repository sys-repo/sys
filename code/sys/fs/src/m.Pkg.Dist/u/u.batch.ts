import { normalizeTargets } from '../../m.Fs.capability/m.Rooted/u/u.target.ts';
import { Is, Num, Path, ServerIs, type t } from '../common.ts';
import {
  snapshotExactDataObject,
  snapshotUntilInput,
  snapshotVerifyLimits,
} from '../u.verify/u.input.ts';
import { failure } from '../u.verify/u.io.ts';

/** Copy a plain record with nonempty string keys; reject proxies and accessors. */
export function namedData(input: unknown): Readonly<Record<string, unknown>> {
  if (ServerIs.Native.proxy(input) || !Is.object(input)) throw failure('invalid-input');
  const keys = Reflect.ownKeys(input);
  if (!keys.every((key): key is string => Is.str(key) && key.length > 0)) {
    throw failure('invalid-input');
  }
  const result = snapshotExactDataObject(input, { ALLOWED: keys, REQUIRED: keys });
  if (!result) throw failure('invalid-input');
  return result;
}

/** Resolve the root and copy the verification and batch limits. */
export function batchInput(values: Readonly<Record<string, unknown>>) {
  if (!Is.str(values.root) || !values.root || values.root.includes('\0')) {
    throw failure('invalid-input');
  }
  const root = Path.resolve(values.root);
  const limits = snapshotVerifyLimits(values.limits);
  const batch = snapshotExactDataObject(values.batch, {
    ALLOWED: ['inventories', 'totalBytes'],
    REQUIRED: ['inventories', 'totalBytes'],
  });
  if (
    !limits || !batch || !Num.Is.safeInt(batch.inventories) || batch.inventories <= 0 ||
    !Num.Is.safeInt(batch.totalBytes) || batch.totalBytes < 0
  ) throw failure('invalid-input');
  const captured: t.Pkg.Dist.BatchLimits = Object.freeze({
    inventories: batch.inventories,
    totalBytes: batch.totalBytes,
  });
  return { root, limits, batch: captured } as const;
}

/** Copy `until` last: validating a signal or disposer may invoke getters. */
export function batchUntil(input: unknown): t.UntilInput {
  try {
    const until = snapshotUntilInput(input);
    if (until) return until.value;
  } catch {
    // Report invalid lifecycle input without exposing exceptions from getters.
  }
  throw failure('invalid-input');
}

/** Require a canonical root-relative directory path accepted by Rooted. */
export function memberDir(value: unknown): string {
  if (!Is.str(value)) throw failure('invalid-input');
  try {
    const [target] = normalizeTargets([{ kind: 'directory', path: value }]);
    if (target.path === value) return value;
  } catch {
    // Report directory validation errors as invalid Dist input.
  }
  throw failure('invalid-input');
}
