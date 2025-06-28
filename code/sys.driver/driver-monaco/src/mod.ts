/**
 * UI module wrapping the Monaco code editor.
 * @module
 */
export { pkg } from './pkg.ts';
/** Type library (barrel file). */
export type * as t from './types.ts';

/**
 * Library:
 */
export { Monaco } from './m.Monaco/mod.ts';
export { EditorCarets, MonacoEditor } from './ui/mod.ts';
