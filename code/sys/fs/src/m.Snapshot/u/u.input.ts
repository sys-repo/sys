import { Is, Num, ServerDispose, ServerIs, StdPath, type t } from '../common.ts';
import { failure, isFailure } from './u.failure.ts';

const NativeObject = Object;
const freeze = NativeObject.freeze;
const getOwnPropertyDescriptor = NativeObject.getOwnPropertyDescriptor;
const getOwnPropertyDescriptors = NativeObject.getOwnPropertyDescriptors;
const getPrototypeOf = NativeObject.getPrototypeOf;
const ownKeys = Reflect.ownKeys;

const MAX_PATH_CODE_UNITS = 32_768;

/** Snapshot one exact file-snapshot options record without invoking its properties. */
export function snapshotOptions(input: unknown): t.SnapshotInput {
  const values = exactRecord(input, ['root', 'path', 'maxBytes', 'timeout'], ['until']);
  const root = pathInput(values.root, 'invalid-root') as t.StringAbsoluteDir;
  const path = pathInput(values.path, 'invalid-path') as t.StringAbsolutePath;
  const maxBytes = byteLimit(values.maxBytes);
  const timeout = finiteTimeout(values.timeout);
  const until = untilInput(values.until);
  return freeze({ root, path, maxBytes, ...(until === undefined ? {} : { until }), timeout });
}

/** Enforce the fixed path-work ceiling after lexical normalization. */
export function normalizedPath(
  input: string,
  kind: 'invalid-root' | 'invalid-path',
): string {
  if (input.length > MAX_PATH_CODE_UNITS) throw failure(kind);
  return input;
}

function pathInput(
  input: unknown,
  kind: 'invalid-root' | 'invalid-path',
): string {
  if (
    !Is.str(input) ||
    input.length === 0 ||
    input.length > MAX_PATH_CODE_UNITS ||
    input.includes('\0') ||
    !StdPath.Is.absolute(input)
  ) {
    throw failure(kind);
  }
  return input;
}

function byteLimit(input: unknown): t.NumberBytes {
  if (!Num.Is.safeInt(input) || input < 0 || input >= Num.MAX_INT) {
    throw failure('invalid-options');
  }
  return input as t.NumberBytes;
}

function finiteTimeout(input: unknown): t.Msecs {
  if (!Num.Is.safeInt(input) || input < 0) throw failure('invalid-options');
  return input as t.Msecs;
}

function untilInput(input: unknown): t.UntilInput {
  try {
    return ServerDispose.Snapshot.until(input);
  } catch (error) {
    // Snapshot owns this wrapper; only this owner authenticates the opaque caller exception.
    const cause = Is.object(error) ? getOwnPropertyDescriptor(error, 'cause')?.value : undefined;
    if (isFailure(cause)) throw cause;
    throw failure('invalid-options');
  }
}

function exactRecord(
  input: unknown,
  required: readonly string[],
  optional: readonly string[],
): Record<string, unknown> {
  if (
    !Is.object(input) ||
    ServerIs.Native.proxy(input) ||
    getPrototypeOf(input) !== NativeObject.prototype
  ) {
    throw failure('invalid-options');
  }

  let descriptors: PropertyDescriptorMap;
  let keys: readonly PropertyKey[];
  try {
    descriptors = getOwnPropertyDescriptors(input);
    keys = ownKeys(input);
  } catch {
    throw failure('invalid-options');
  }

  const allowed = new Set([...required, ...optional]);
  if (keys.some((key) => !Is.str(key) || !allowed.has(key))) {
    throw failure('invalid-options');
  }
  if (required.some((key) => !keys.includes(key))) throw failure('invalid-options');

  const output: Record<string, unknown> = {};
  for (const key of keys) {
    const descriptor = descriptors[key as string];
    if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
      throw failure('invalid-options');
    }
    output[key as string] = descriptor.value;
  }
  return output;
}
