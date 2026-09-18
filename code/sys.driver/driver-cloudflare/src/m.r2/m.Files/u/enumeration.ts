import { Bytes, Err, Is, Num, Obj, type t } from '../common.ts';
import { fail, invalidPath } from './error.ts';
import { MAX_OBJECT_KEY_BYTES } from './path.ts';

type Limits = t.R2.Files.EnumerationLimits;
type Counter = keyof Limits;

/** Finite defaults for each Files command, independent of its result-page limit. */
export const DEFAULT_ENUMERATION: Limits = Object.freeze({
  maxRequests: 64,
  maxObjects: 10_000,
  maxKeyBytes: 8 * 1024 * 1024,
  maxEntries: 20_000,
  maxPathBytes: 16 * 1024 * 1024,
});

/** Upper admission bounds; callers may choose lower positive integral limits. */
export const MAX_ENUMERATION: Limits = Object.freeze({
  maxRequests: 1024,
  maxObjects: 100_000,
  maxKeyBytes: 64 * 1024 * 1024,
  maxEntries: 200_000,
  maxPathBytes: 128 * 1024 * 1024,
});

/** One command's shared enumeration accounting, never a bucket-global counter. */
export type EnumerationBudget = {
  request(): void;
  object(object: t.R2.ObjectInfo): void;
  entry(path: string, copies: number): void;
  path(path: string, copies?: number): void;
};

/** Snapshot the complete input policy without invoking policy field accessors. */
export function enumerationLimits(input: Limits | undefined): Limits {
  if (input === undefined) return DEFAULT_ENUMERATION;
  if (!Is.plainObject(input)) throw invalidPath('Invalid R2 Files enumeration policy');
  const descriptors = Object.getOwnPropertyDescriptors(input);
  const keys = Obj.keys(DEFAULT_ENUMERATION);
  if (Reflect.ownKeys(descriptors).length !== keys.length) {
    throw invalidPath('R2 Files enumeration policy must contain exactly the five limits');
  }
  const result = {} as Record<Counter, number>;
  for (const key of keys) {
    const descriptor = descriptors[key];
    const value: unknown = descriptor && 'value' in descriptor ? descriptor.value : undefined;
    if (!Num.Is.safeInt(value) || value < 1 || value > MAX_ENUMERATION[key]) {
      throw invalidPath(`Invalid R2 Files enumeration ${key}`);
    }
    result[key] = value;
  }
  return Object.freeze(result);
}

/** Create finite accounting for one operation; all its scans share these counters. */
export function enumerationBudget(limits: Limits): EnumerationBudget {
  const used: Record<Counter, number> = {
    maxRequests: 0,
    maxObjects: 0,
    maxKeyBytes: 0,
    maxEntries: 0,
    maxPathBytes: 0,
  };
  let failure: Error | undefined;
  const take = (key: Counter, amount: number) => {
    if (failure) throw failure;
    if (amount > limits[key] - used[key]) {
      // Cmd forwards native Error.message, not a typed provider branch or StdError object.
      failure = Err.normalize(
        fail('FilesR2Error.EnumerationLimit', `R2 Files enumeration limit exceeded (${key})`),
      );
      throw failure;
    }
    used[key] += amount;
  };
  const path = (value: string, copies = 1) =>
    take('maxPathBytes', Bytes.utf8ByteLength(value) * copies);
  return Object.freeze({
    request: () => take('maxRequests', 1),
    object(object) {
      take('maxObjects', 1);
      if (!Is.str(object.key)) throw invalidPath('Invalid listed R2 object key');
      const bytes = Bytes.utf8ByteLength(object.key);
      take('maxKeyBytes', bytes);
      if (bytes > MAX_OBJECT_KEY_BYTES) {
        throw invalidPath('Listed R2 object key exceeds byte limit');
      }
    },
    entry(value, copies) {
      take('maxEntries', 1);
      path(value, copies);
    },
    path,
  });
}
