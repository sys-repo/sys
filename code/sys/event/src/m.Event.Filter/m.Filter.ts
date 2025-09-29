import type { t } from './common.ts';
import { makeFilter } from './u.makeFilter.ts';

type B = t.EventWithKind;

/**
 * Typed builder for compile-time narrowing. Prefer in production/tests.
 */
export const filterFor: <E extends B>() => t.EventFilterLib<E> = <E extends B>() => makeFilter<E>();
