import { Arr, Is, Num, Obj, ServerIs, StdPath, type t } from '../common.ts';
import { failure, isFailure } from './u.snapshot.failure.ts';

const NativeArray = Array;
const NativeObject = Object;
const freeze = NativeObject.freeze;
const getOwnPropertyDescriptor = NativeObject.getOwnPropertyDescriptor;
const getOwnPropertyDescriptors = NativeObject.getOwnPropertyDescriptors;
const getPrototypeOf = NativeObject.getPrototypeOf;
const ownKeys = Reflect.ownKeys;

const MAX_PATH_CODE_UNITS = 32_768;
const MAX_UNTIL_NODES = 256;
const MAX_UNTIL_DEPTH = 32;

type UntilBudget = { nodes: number };

export type SnapshotInput = {
  readonly root: t.StringAbsoluteDir;
  readonly path: t.StringAbsolutePath;
  readonly maxBytes: t.NumberBytes;
  readonly until?: t.UntilInput;
  readonly timeout: t.Msecs;
};

/** Snapshot one exact file-snapshot options record without invoking its properties. */
export function snapshotOptions(input: unknown): SnapshotInput {
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

function untilInput(input: unknown): t.UntilInput | undefined {
  if (input === undefined) return undefined;
  try {
    return snapshotUntil(input, new WeakSet<object>(), { nodes: 0 }, 0);
  } catch (cause) {
    if (isFailure(cause)) throw cause;
    throw failure('invalid-options');
  }
}

function snapshotUntil(
  input: unknown,
  seen: WeakSet<object>,
  budget: UntilBudget,
  arrayDepth: number,
): t.UntilInput {
  if (!Is.object(input) || ServerIs.Native.proxy(input)) throw failure('invalid-options');
  consumeUntilNode(budget);
  if (!Arr.isArray(input)) {
    if (hasProxyPrototype(input) || !Is.untilInput(input)) throw failure('invalid-options');
    return input as t.UntilInput;
  }

  if (
    arrayDepth >= MAX_UNTIL_DEPTH ||
    getPrototypeOf(input) !== NativeArray.prototype ||
    seen.has(input)
  ) {
    throw failure('invalid-options');
  }
  seen.add(input);

  const lengthDescriptor = getOwnPropertyDescriptor(input, 'length');
  if (!lengthDescriptor || !Obj.hasOwn(lengthDescriptor, 'value')) {
    throw failure('invalid-options');
  }
  const length = lengthDescriptor.value;
  if (
    !Num.Is.safeInt(length) ||
    length < 0 ||
    length > MAX_UNTIL_NODES - budget.nodes
  ) {
    throw failure('invalid-options');
  }

  const descriptors = getOwnPropertyDescriptors(input);
  const keys = ownKeys(input);
  if (keys.length !== length + 1) throw failure('invalid-options');

  const snapshot: t.UntilInput[] = [];
  for (let index = 0; index < length; index++) {
    const key = String(index);
    if (!Obj.hasOwn(descriptors, key)) throw failure('invalid-options');
    const descriptor = descriptors[key];
    if (!descriptor || !('value' in descriptor) || descriptor.enumerable !== true) {
      throw failure('invalid-options');
    }
    snapshot.push(snapshotUntilValue(descriptor.value, seen, budget, arrayDepth + 1));
  }
  if (keys.some((key) => key !== 'length' && !/^\d+$/u.test(String(key)))) {
    throw failure('invalid-options');
  }
  return freeze(snapshot) as t.UntilInput;
}

function snapshotUntilValue(
  input: unknown,
  seen: WeakSet<object>,
  budget: UntilBudget,
  arrayDepth: number,
): t.UntilInput {
  if (input === undefined) {
    consumeUntilNode(budget);
    return undefined;
  }
  return snapshotUntil(input, seen, budget, arrayDepth);
}

function consumeUntilNode(budget: UntilBudget): void {
  budget.nodes++;
  if (budget.nodes > MAX_UNTIL_NODES) throw failure('invalid-options');
}

function hasProxyPrototype(input: object): boolean {
  let current = getPrototypeOf(input);
  while (current) {
    if (ServerIs.Native.proxy(current)) return true;
    current = getPrototypeOf(current);
  }
  return false;
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
