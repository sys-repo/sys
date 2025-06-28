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
export { EditorCarets, Monaco, MonacoEditor } from './ui/m.Monaco/mod.ts';
