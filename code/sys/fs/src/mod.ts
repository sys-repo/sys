/**
 * @module
 * Tools for working with the file-system.
 */
import { Fs } from './m.Fs/mod.ts';
import { Path } from './m.Path/mod.ts';
export { pkg } from './pkg.ts';

/** Type library (barrel file). */
export type * as t from './types.ts';

/**
 * Helpers.
 */
export { Dir } from './m.Dir/mod.ts';
export { Env } from './m.Env/mod.ts';
export { FileMap } from './m.FileMap/mod.ts';
/** File path helpers with POSIX-style utilities. */
export { Path };
/** Short alias for file path helpers. */
export const P = Path;
export { Pkg } from './m.Pkg/mod.ts';
export { Watch } from './m.Watch/mod.ts';

/**
 * Main Library.
 */
export { Fs };
/** Default filesystem helper library. */
const Default = Fs;
export default Default;
