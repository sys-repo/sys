/**
 * Canonical deep structural equality primitive for `@sys/std` internals.
 *
 * This is the single implementation behind `Obj.eql` and the legacy `R.equals`
 * compatibility facade. Domain-specific equality helpers may still exist
 * (for example semver or object-path equality), but they should not duplicate
 * this general-purpose deep equality behavior.
 */
export function equals(a: unknown, b: unknown): boolean {
  return deepEquals(a, b, new WeakMap<object, WeakSet<object>>());
}

type Seen = WeakMap<object, WeakSet<object>>;
type SeenMark =
  | { readonly kind: 'map'; readonly key: object }
  | { readonly kind: 'set'; readonly set: WeakSet<object>; readonly value: object };

function deepEquals(a: unknown, b: unknown, seen: Seen, trail?: SeenMark[]): boolean {
  if (Object.is(a, b)) return true;
  if (a === null || b === null) return false;
  if (typeof a !== 'object' || typeof b !== 'object') return false;

  if (markSeen(a, b, seen, trail)) return true;

  if (a instanceof Date || b instanceof Date) {
    return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  }

  if (a instanceof RegExp || b instanceof RegExp) {
    return a instanceof RegExp &&
      b instanceof RegExp &&
      a.source === b.source &&
      a.flags === b.flags;
  }

  if (ArrayBuffer.isView(a) || ArrayBuffer.isView(b)) return equalArrayBufferViews(a, b);
  if (a instanceof ArrayBuffer || b instanceof ArrayBuffer) return equalArrayBuffers(a, b);

  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((item, index) => deepEquals(item, b[index], seen, trail));
  }

  if (a instanceof Map || b instanceof Map) return equalMaps(a, b, seen, trail);
  if (a instanceof Set || b instanceof Set) return equalSets(a, b, seen, trail);

  const aKeys = Reflect.ownKeys(a);
  const bKeys = Reflect.ownKeys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) =>
    bKeys.includes(key) &&
    deepEquals(
      (a as Record<PropertyKey, unknown>)[key],
      (b as Record<PropertyKey, unknown>)[key],
      seen,
      trail,
    )
  );
}

function equalArrayBufferViews(a: unknown, b: unknown) {
  if (!ArrayBuffer.isView(a) || !ArrayBuffer.isView(b)) return false;
  if (a.constructor !== b.constructor || a.byteLength !== b.byteLength) return false;
  return equalBytes(
    new Uint8Array(a.buffer, a.byteOffset, a.byteLength),
    new Uint8Array(b.buffer, b.byteOffset, b.byteLength),
  );
}

function equalArrayBuffers(a: unknown, b: unknown) {
  if (!(a instanceof ArrayBuffer) || !(b instanceof ArrayBuffer)) return false;
  return equalBytes(new Uint8Array(a), new Uint8Array(b));
}

function equalBytes(a: Uint8Array, b: Uint8Array) {
  if (a.byteLength !== b.byteLength) return false;
  return a.every((byte, index) => byte === b[index]);
}

function equalMaps(a: unknown, b: unknown, seen: Seen, trail?: SeenMark[]) {
  if (!(a instanceof Map) || !(b instanceof Map) || a.size !== b.size) return false;
  const remaining = [...b.entries()];
  for (const [aKey, aValue] of a.entries()) {
    const index = remaining.findIndex(([bKey, bValue]) =>
      matchesMapEntry(aKey, aValue, bKey, bValue, seen, trail)
    );
    if (index < 0) return false;
    remaining.splice(index, 1);
  }
  return true;
}

function equalSets(a: unknown, b: unknown, seen: Seen, trail?: SeenMark[]) {
  if (!(a instanceof Set) || !(b instanceof Set) || a.size !== b.size) return false;
  const remaining = [...b.values()];
  for (const aValue of a.values()) {
    const index = remaining.findIndex((bValue) => matchesSetValue(aValue, bValue, seen, trail));
    if (index < 0) return false;
    remaining.splice(index, 1);
  }
  return true;
}

function matchesMapEntry(
  aKey: unknown,
  aValue: unknown,
  bKey: unknown,
  bValue: unknown,
  seen: Seen,
  parentTrail?: SeenMark[],
) {
  const trail: SeenMark[] = [];
  const ok = deepEquals(aKey, bKey, seen, trail) && deepEquals(aValue, bValue, seen, trail);
  if (ok) parentTrail?.push(...trail);
  else rollback(trail, seen);
  return ok;
}

function matchesSetValue(
  aValue: unknown,
  bValue: unknown,
  seen: Seen,
  parentTrail?: SeenMark[],
) {
  const trail: SeenMark[] = [];
  const ok = deepEquals(aValue, bValue, seen, trail);
  if (ok) parentTrail?.push(...trail);
  else rollback(trail, seen);
  return ok;
}

function markSeen(a: object, b: object, seen: Seen, trail?: SeenMark[]) {
  const prior = seen.get(a);
  if (prior?.has(b)) return true;

  if (prior) {
    prior.add(b);
    trail?.push({ kind: 'set', set: prior, value: b });
  } else {
    seen.set(a, new WeakSet([b]));
    trail?.push({ kind: 'map', key: a });
  }
  return false;
}

function rollback(trail: readonly SeenMark[], seen: Seen) {
  for (let i = trail.length - 1; i >= 0; i -= 1) {
    const mark = trail[i];
    if (mark.kind === 'map') seen.delete(mark.key);
    else mark.set.delete(mark.value);
  }
}
