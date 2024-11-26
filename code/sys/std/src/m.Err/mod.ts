/**
 * @module
 * Tools for working with errors.
 *
 * @example
 * Catch an error thrown within an async/callback function.
 * ```
 * const getExample = async (id: number) => ({ id });
 * const res = await Err.catch(getExample(1));
 *       ~~~
 *        ↑ { ok: true, data: { id: 1 } }
 *        - { ok: false, error: { message: '...' } }
 * ```
 */
export { Err } from './m.Err.ts';
