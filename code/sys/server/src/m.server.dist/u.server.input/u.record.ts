import { Is, Obj, type t } from './common.ts';

/** Snapshot only own data fields from one exact input record. */
export function snapshotRecord(
  input: unknown,
  allowed: readonly string[],
  required: readonly string[],
): t.DistServerInput.Record | undefined {
  if (!Is.object(input) || Is.Native.proxy(input)) return;
  const prototype = Object.getPrototypeOf(input);
  if (prototype !== Object.prototype && prototype !== null) return;

  const keys = Reflect.ownKeys(input);
  if (keys.some((key) => !Is.str(key) || !allowed.includes(key))) return;
  if (required.some((key) => !Obj.hasOwn(input, key))) return;

  const output: Record<string, unknown> = {};
  for (const key of keys) {
    if (!Is.str(key)) return;
    const descriptor = Object.getOwnPropertyDescriptor(input, key);
    if (!descriptor || !Obj.hasOwn(descriptor, 'value')) return;
    output[key] = descriptor.value;
  }
  return Object.freeze(output);
}

/** Select an already-admitted field subset without revisiting caller-owned input. */
export function selectFields(
  source: t.DistServerInput.Record,
  keys: readonly string[],
): t.DistServerInput.Record {
  const output: Record<string, unknown> = {};
  for (const key of keys) {
    if (Obj.hasOwn(source, key)) output[key] = source[key];
  }
  return Object.freeze(output);
}
