/**
 * Tools for working with the file-system.
 * @module
 */
import { Fs } from './m.Fs/mod.ts';
export { pkg } from './pkg.ts';

/** Type library (barrel file). */
export type * as t from './types.ts';

/**
 * Helpers.
 */
export { Dir } from './m.Dir/mod.ts';
export { Env } from './m.Env/mod.ts';
export { FileMap } from './m.FileMap/mod.ts';
export { Path as P, Path } from './m.Path/mod.ts';
export { Pkg } from './m.Pkg/mod.ts';
export { Watch } from './m.Watch/mod.ts';

/**
 * Main Library.
 */
export { Fs };
export default Fs;
