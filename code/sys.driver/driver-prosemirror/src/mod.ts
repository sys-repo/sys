/**
 * @module
 * ProseMirror-backed React components wired for CRDT text editing.
 */
export { pkg } from './pkg.ts';
/** Type library (barrel file). */
export type * as t from './types.ts';

/** Plain ProseMirror editor component bound to an Automerge document path. */
export { TextEditor } from './ui/ui.TextEditor/mod.ts';
/** Labeled editor panel component for a CRDT-backed text field. */
export { TextPanel } from './ui/ui.TextPanel/mod.ts';
