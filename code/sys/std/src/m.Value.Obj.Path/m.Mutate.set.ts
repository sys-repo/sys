import { type t } from './common.ts';

type O = Record<string, unknown>;
type Path = t.ObjectPath;
type Op = t.ObjDiffOp;

/**
 * Mutates `subject`, setting (or deleting) a nested value at `path`, and
 * returns the precise `ObjDiffOp` that describes what changed.
 *
 * - Creates intermediate objects/arrays as needed.
 * - Writing `undefined` removes the key via `delete`.
 * - Returns `undefined` if the operation was a no-op (`Object.is` equality).
 */
export function set<T = unknown>(subject: O, path: Path, value: T): Op | undefined {
  if (path.length === 0) throw new Error('The path-array must contain at least one segment');

  let node: any = subject;

  for (let i = 0; i < path.length - 1; i += 1) {
    const key = path[i];
    const nextKey = path[i + 1];
    const shouldBeArray = typeof nextKey === 'number';

    const shouldUpdate =
      node[key] === undefined ||
      (shouldBeArray && !Array.isArray(node[key])) ||
      (!shouldBeArray && typeof node[key] !== 'object');

    if (shouldUpdate) node[key] = shouldBeArray ? [] : {};
    node = node[key];
  }

  const lastKey = path[path.length - 1];
  const prev = node[lastKey];

  // Early-exit if nothing would actually change.
  // NB: Important for accurate diff streams and to avoid unnecessary invalidations.
  if (Object.is(prev, value) || (value === undefined && !(lastKey in node))) {
    return undefined;
  }

  // Perform the mutation:
  if (value === undefined) {
    delete node[lastKey];
  } else {
    node[lastKey] = value;
  }

  // Finish up.
  const op = wrangle.op(path, value, prev);
  return op;
}

/**
 * Helpers:
 */
const wrangle = {
  op(path: t.ObjectPath, value: unknown, prev: unknown): Op {
    if (value === undefined) {
      // REMOVED (key existed only in → target).
      return { type: 'remove', path, prev };
    }

    if (prev === undefined) {
      // ADDED (key existed only in → source).
      return { type: 'add', path, value };
    }

    if (Array.isArray(prev) && Array.isArray(value)) {
      // WHOLE ARRAY REPLACED.
      return { type: 'array', path, prev, next: value as unknown[] };
    }

    // UPDATED (primitive or object leaf changed).
    return { type: 'update', path, prev, next: value };
  },
} as const;
