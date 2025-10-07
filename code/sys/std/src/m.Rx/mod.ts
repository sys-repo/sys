/**
 * Tools for working with Observables (via `rxjs`).
 * @module
 *
 * @example
 * ```ts
 * import { rx } from '@sys/std/rx';
 *
 * type T = { count: number };
 * const $ = rx.subject<T>();
 * const next = (count: number) => $.next({ count });
 * $.pipe(rx.filter((e) => e.count > 2)).subscribe((e) => console.info('count:', e.count));
 *
 * next(1);
 * next(2);
 * next(3);
 * ```
 */
import './u.polyfill.ts';
export { Rx } from './m.Rx.ts';
