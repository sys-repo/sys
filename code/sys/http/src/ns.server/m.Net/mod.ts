/**
 * @module
 * Tools for working with a network.
 *
 * @example
 * ```ts
 * import { Net, Port } from '@sys/http/server';
 * const port = Net.Port.random();
 * ```
 */
import { Net } from './m.Net.ts';

export { Port } from './m.Port.ts';
export { Net };

export default Net;
