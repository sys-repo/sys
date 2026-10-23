import { Is, Num, Obj, Pkg, ServerIs, type t } from './u.verify/common.ts';
import { failure, isFailure } from './u.verify/u.io.ts';
import { addBytes } from './u.verify/u.limit.ts';

/**
 * Selected own enumerable claims only; caller objects are neither invoked nor frozen.
 */
export const inspect: t.Pkg.Dist.Inventory.Method = (args) => {
  try {
    if (!Is.object(args) || ServerIs.Native.proxy(args)) return refuse('invalid-input');
    const prototype = Object.getPrototypeOf(args);
    if (prototype !== Object.prototype && prototype !== null) return refuse('invalid-input');
    const limits = captureLimits(dataValue(args, 'limits'));
    if (!limits) return refuse('invalid-input');
    const input = dataValue(args, 'parts');
    if (!Is.object(input) || ServerIs.Native.proxy(input)) return refuse('malformed');
    const inputPrototype = Object.getPrototypeOf(input);
    if (inputPrototype !== Object.prototype && inputPrototype !== null) return refuse('malformed');

    const files: t.Pkg.Dist.Inventory.File[] = [];
    let pathUnits = 0;
    let totalBytes = 0;
    let packageBytes = 0;
    // Bound before whole-collection arrays, regex parsing and directory expansion.
    for (const path in input) {
      if (!Obj.hasOwn(input, path)) continue;
      if (files.length >= limits.entries || path.length > limits.pathLength) {
        throw failure('limit-exceeded');
      }
      pathUnits = addBytes(pathUnits, path.length, limits.pathTotal);
      if (!path.isWellFormed()) throw failure('unsafe-path');
      const value = dataValue(input, path);
      if (!Is.str(value) || value.length > 93) throw failure('malformed');
      const part = Pkg.Dist.Part.parse(value);
      if (!part || part.size === undefined) throw failure('malformed');
      if (part.size > limits.fileBytes) throw failure('limit-exceeded');
      totalBytes = addBytes(totalBytes, part.size, limits.totalBytes);
      if (Pkg.Dist.Is.codePath(path)) {
        packageBytes = addBytes(packageBytes, part.size, limits.totalBytes);
      }
      files.push(Object.freeze({ path, hash: part.hash, size: part.size }));
    }
    if (!files.length) throw failure('malformed');

    // Keep FS's refusal precedence: bounded claim parsing precedes prefix accounting.
    // Count the manifest once, payload files, and each distinct implied directory.
    let entries = addBytes(1, files.length, limits.entries);
    let prefixUnits = 0;
    const directories = new Set<string>();
    for (const { path } of files) {
      let separator = path.indexOf('/');
      while (separator >= 0) {
        // Full-path and prefix-work units have separate budgets. Charge repeats before slicing.
        prefixUnits = addBytes(prefixUnits, separator, limits.pathTotal);
        const directory = path.slice(0, separator);
        if (!directories.has(directory)) {
          entries = addBytes(entries, 1, limits.entries);
          directories.add(directory);
        }
        separator = path.indexOf('/', separator + 1);
      }
    }
    return Object.freeze({
      kind: 'inspected',
      files: Object.freeze(files),
      totalBytes,
      packageBytes,
    });
  } catch (cause) {
    if (isFailure(cause)) {
      const { kind } = cause;
      if (kind === 'malformed' || kind === 'unsafe-path' || kind === 'limit-exceeded') {
        return refuse(kind);
      }
    }
    return refuse('malformed');
  }
};

/** Capture only the fixed limit fields; unrelated properties and metadata are not traversed. */
function captureLimits(
  input: unknown,
): Readonly<Required<t.Pkg.Dist.Inventory.Limits>> | undefined {
  if (!Is.object(input) || ServerIs.Native.proxy(input)) return;
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) return;
  const values: Record<string, unknown> = {};
  for (const key of ['entries', 'fileBytes', 'totalBytes', 'pathLength', 'pathTotal'] as const) {
    const descriptor = Object.getOwnPropertyDescriptor(input, key);
    if (descriptor && !Obj.hasOwn(descriptor, 'value')) return;
    values[key] = descriptor?.value;
  }
  const { entries, fileBytes, totalBytes } = values;
  const ceilings = Pkg.Dist.Content.limits;
  const pathLength = values.pathLength === undefined ? ceilings.pathLength : values.pathLength;
  const pathTotal = values.pathTotal === undefined ? ceilings.pathTotal : values.pathTotal;
  if (
    !Num.Is.safeInt(entries) || entries < 1 ||
    !Num.Is.safeInt(fileBytes) || fileBytes < 0 ||
    !Num.Is.safeInt(totalBytes) || totalBytes < 0 ||
    !Num.Is.safeInt(pathLength) || pathLength < 1 ||
    !Num.Is.safeInt(pathTotal) || pathTotal < 1
  ) return;
  return Object.freeze({
    entries: Math.min(entries, ceilings.entries),
    fileBytes,
    totalBytes,
    pathLength: Math.min(pathLength, ceilings.pathLength),
    pathTotal: Math.min(pathTotal, ceilings.pathTotal),
  });
}

function dataValue(input: object, key: string): unknown {
  const descriptor = Object.getOwnPropertyDescriptor(input, key);
  return descriptor && Obj.hasOwn(descriptor, 'value') ? descriptor.value : undefined;
}

function refuse(kind: t.Pkg.Dist.Inventory.FailureKind): t.Pkg.Dist.Inventory.Failure {
  return Object.freeze({ kind });
}
