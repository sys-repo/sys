import { equalArrayBuffers, equalArrayBufferViews } from './u.kernel.bytes.ts';
import { equalDates, equalRegExps } from './u.kernel.builtins.ts';
import { equalMaps, equalSets } from './u.kernel.collections.ts';
import { markSeen } from './u.kernel.graph.ts';
import { isObjectLike, valueKind } from './u.kernel.kind.ts';
import { equalOwnProperties } from './u.kernel.properties.ts';
import type { Seen, SeenMark } from './t.kernel.ts';

/**
 * Deep structural equality over the supported pure-data domain.
 */
export function deepEquals(a: unknown, b: unknown, seen: Seen, trail?: SeenMark[]): boolean {
  if (Object.is(a, b)) {
    if (!isObjectLike(a) || !isObjectLike(b)) return true;
    const seenPair = markSeen(a, b, seen, trail);
    return seenPair ?? true;
  }
  if (!isObjectLike(a) || !isObjectLike(b)) return false;

  const kind = valueKind(a);
  if (kind === 'opaque' || kind !== valueKind(b)) return false;
  if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;

  const seenPair = markSeen(a, b, seen, trail);
  if (seenPair !== undefined) return seenPair;

  switch (kind) {
    case 'array':
      return Array.isArray(a) && Array.isArray(b) &&
        equalOwnProperties(a, b, seen, deepEquals, trail);

    case 'array-buffer':
      return equalArrayBuffers(a as ArrayBuffer, b as ArrayBuffer) &&
        equalOwnProperties(a, b, seen, deepEquals, trail);

    case 'array-buffer-view':
      return ArrayBuffer.isView(a) &&
        ArrayBuffer.isView(b) &&
        equalArrayBufferViews(a, b) &&
        equalOwnProperties(a, b, seen, deepEquals, trail);

    case 'date':
      return equalDates(a as Date, b as Date) &&
        equalOwnProperties(a, b, seen, deepEquals, trail);

    case 'map':
      return equalOwnProperties(a, b, seen, deepEquals, trail) &&
        equalMaps(a as Map<unknown, unknown>, b as Map<unknown, unknown>, seen, deepEquals, trail);

    case 'record':
      return equalOwnProperties(a, b, seen, deepEquals, trail);

    case 'regexp':
      return equalRegExps(a as RegExp, b as RegExp) &&
        equalOwnProperties(a, b, seen, deepEquals, trail);

    case 'set':
      return equalOwnProperties(a, b, seen, deepEquals, trail) &&
        equalSets(a as Set<unknown>, b as Set<unknown>, seen, deepEquals, trail);
  }

  return false;
}
