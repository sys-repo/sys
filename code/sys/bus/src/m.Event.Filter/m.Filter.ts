import type { t } from './common.ts';
import { makeFilter } from './u.makeFilter.ts';

type B = t.EventWithKind;

/**
 * Default (un-specialized) instance — runtime OK, no compile-time narrowing.
 */
export const Filter: t.EventFilterLib<B> = makeFilter<B>();

/**
 * Typed builder for compile-time narrowing. Prefer in production/tests.
 */
export const FilterFor: <E extends B>() => t.EventFilterLib<E> = <E extends B>() => makeFilter<E>();
