import { Arr, Is, Num, Obj, ServerIs, Str, type t } from '../common.ts';
import { failure } from './u.error.ts';
import { normalizeTargets } from './u.target.ts';
import { snapshotUntilInput } from './u.until.ts';
import { byteLengthOf } from './u.write.bytes.ts';

const freeze = Object.freeze;
const create = Object.create;
const ownKeys = Reflect.ownKeys;
const descriptorOf = Object.getOwnPropertyDescriptor;
const prototypeOf = Object.getPrototypeOf;
const arrayPrototype = Array.prototype;
const objectPrototype = Object.prototype;
const isWellFormed = String.prototype.isWellFormed;
const encode = TextEncoder.prototype.encode.bind(new TextEncoder());
const compare = Str.Compare.codeUnit();
const LIMITS = [
  'maxEntries',
  'maxPathBytes',
  'maxPathDepth',
  'maxFileBytes',
  'maxTreeBytes',
] as const;

/** Admit one immutable specification without executing any content iterator. */
export function treeWriteInput(entries: unknown, options: unknown): t.RootedTreeInput {
  const values = record(options, [...LIMITS, 'timeout', 'until'], 'invalid-options');
  for (const key of LIMITS) {
    if (!Num.Is.safeInt(values[key]) || values[key] <= 0) throw invalid('invalid-options');
  }
  if (!Num.Is.safeInt(values.timeout) || values.timeout < 0) throw invalid('invalid-options');
  // All numeric members were checked individually at this exact-record boundary.
  const limits = values as unknown as t.FsRooted.TreeWriteOptions;
  const supplied = denseArray(entries);
  if (supplied.length > limits.maxEntries) throw invalid('limit-exceeded');
  let total = 0;
  const captured: t.FsRooted.TreeEntry[] = supplied.map((entry) => {
    const value = record(entry, ['kind', 'path', 'expectedBytes', 'content'], 'invalid-target');
    if (!Is.str(value.path) || (value.kind !== 'file' && value.kind !== 'directory')) {
      throw invalid('invalid-target');
    }
    if (value.path.length > limits.maxPathBytes) throw invalid('limit-exceeded');
    if (!isWellFormed.call(value.path)) throw invalid('invalid-target');
    if (byteLengthOf(encode(value.path)) > limits.maxPathBytes) throw invalid('limit-exceeded');
    if (value.kind === 'directory') {
      if (!Arr.equal(ownKeys(value).sort(), ['kind', 'path'])) throw invalid('invalid-target');
      return freeze({ kind: value.kind, path: value.path });
    }
    if (
      !Obj.hasOwn(value, 'content') || !Num.Is.safeInt(value.expectedBytes) ||
      value.expectedBytes < 0
    ) {
      throw invalid('invalid-target');
    }
    if (
      value.expectedBytes > limits.maxFileBytes || value.expectedBytes > limits.maxTreeBytes - total
    ) {
      throw invalid('limit-exceeded');
    }
    total += value.expectedBytes;
    return freeze({
      kind: value.kind,
      path: value.path,
      expectedBytes: value.expectedBytes,
      // Content remains opaque until this file is current; malformed sources are producer failures.
      content: value.content as AsyncIterable<Uint8Array>,
    });
  });
  // Only captured data reaches Rooted's existing lexical owner, never user properties.
  const normalized = normalizeTargets(captured);
  const byPath = new Map(normalized.map((entry) => [entry.path, entry.kind]));
  const snapshot = captured.map((entry, index) => {
    const path = normalized[index].path;
    if (
      byteLengthOf(encode(path)) > limits.maxPathBytes ||
      path.split('/').length > limits.maxPathDepth
    ) {
      throw invalid('limit-exceeded');
    }
    let parent = path.lastIndexOf('/');
    // Explicit prefix traversal proves every non-root parent was supplied.
    while (parent >= 0) {
      if (byPath.get(path.slice(0, parent)) !== 'directory') throw invalid('invalid-target');
      parent = path.lastIndexOf('/', parent - 1);
    }
    return freeze({ ...entry, path });
  });
  const until = snapshotUntilInput(values.until);
  if (!until) throw invalid('invalid-options');
  const capturedOptions: t.FsRooted.TreeWriteOptions = freeze({
    maxEntries: limits.maxEntries,
    maxPathBytes: limits.maxPathBytes,
    maxPathDepth: limits.maxPathDepth,
    maxFileBytes: limits.maxFileBytes,
    maxTreeBytes: limits.maxTreeBytes,
    timeout: limits.timeout,
    until: until.value,
  });
  const directories = snapshot.filter((entry) => entry.kind === 'directory').sort((a, b) => {
    return a.path.split('/').length - b.path.split('/').length || compare(a.path, b.path);
  });
  return freeze({
    entries: freeze(snapshot),
    directories: freeze(directories),
    options: capturedOptions,
  });
}

/** Require exact own data fields without invoking accessors or Proxy traps. */
function record(
  input: unknown,
  keys: readonly string[],
  kind: 'invalid-options' | 'invalid-target',
): Record<string, unknown> {
  if (!Is.object(input) || ServerIs.Native.proxy(input) || prototypeOf(input) !== objectPrototype) {
    throw invalid(kind);
  }
  const result: Record<string, unknown> = create(null);
  for (const key of ownKeys(input)) {
    if (!Is.str(key) || !keys.includes(key)) throw invalid(kind);
    const descriptor = descriptorOf(input, key);
    if (!descriptor || !Obj.hasOwn(descriptor, 'value')) throw invalid(kind);
    result[key] = descriptor.value;
  }
  return result;
}

function denseArray(input: unknown): unknown[] {
  if (ServerIs.Native.proxy(input) || !Is.array(input) || prototypeOf(input) !== arrayPrototype) {
    throw invalid('invalid-target');
  }
  const length = descriptorOf(input, 'length')?.value;
  if (!Num.Is.safeInt(length) || length < 0 || ownKeys(input).length !== length + 1) {
    throw invalid('invalid-target');
  }
  const result: unknown[] = [];
  // Index descriptors distinguish a dense native array from holes and executable accessors.
  for (let index = 0; index < length; index++) {
    const descriptor = descriptorOf(input, String(index));
    if (!descriptor || descriptor.enumerable !== true || !Obj.hasOwn(descriptor, 'value')) {
      throw invalid('invalid-target');
    }
    result[index] = descriptor.value;
  }
  return result;
}

function invalid(kind: t.FsRooted.FailureKind): t.FsRooted.Failure {
  return failure('write-tree', kind);
}
