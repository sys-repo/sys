/**
 * Internal structural-equality kernel contracts.
 */

export type Seen = {
  readonly left: WeakMap<object, object>;
  readonly right: WeakMap<object, object>;
};

export type SeenMark = {
  readonly left: object;
  readonly right: object;
};

export type ValueKind =
  | 'array'
  | 'array-buffer'
  | 'array-buffer-view'
  | 'date'
  | 'map'
  | 'opaque'
  | 'record'
  | 'regexp'
  | 'set';

export type DeepEquals = (
  a: unknown,
  b: unknown,
  seen: Seen,
  trail?: SeenMark[],
) => boolean;
