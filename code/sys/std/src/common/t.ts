export type * from '../types.ts';

export type { EffectController, Json, Pkg, Semver, Signal } from '../types.ts';
export type * from '@sys/types';

export type RProp = {
  <K extends PropertyKey>(key: K): (obj: Record<K, unknown>) => unknown;
  <K extends PropertyKey, T extends Record<K, unknown>>(key: K, obj: T): T[K];
};

export type RSortBy = {
  <T>(fn: (item: T) => unknown): (items: readonly T[]) => T[];
  <T>(fn: (item: T) => unknown, items: readonly T[]): T[];
};

/**
 * Small functional helper subset kept behind the legacy `R` facade.
 */
export type RLib = {
  readonly clone: <T>(value: T) => T;
  readonly clamp: (min: number, max: number, value: number) => number;
  readonly equals: (a: unknown, b: unknown) => boolean;
  readonly mergeDeepRight: <L extends object, R extends object>(left: L, right: R) => L & R;
  readonly flatten: <T>(list: readonly unknown[]) => T[];
  readonly is: (ctor: unknown, value: unknown) => boolean;
  readonly prop: RProp;
  readonly sort: <T>(compare: (a: T, b: T) => number, items: readonly T[]) => T[];
  readonly sortBy: RSortBy;
  readonly toString: (value: unknown) => string;
  readonly uniq: <T>(items: readonly T[]) => T[];
  readonly uniqBy: <T>(fn: (item: T) => unknown, items: readonly T[]) => T[];
};
