/**
 * @module
 * Shared KeyValue-family spec fixtures.
 *
 * Spec-only boundary for cursor debug and host-handoff proof helpers shared by
 * KeyValue-family harnesses. This is the cross-harness import seam; public
 * runtime contracts graduate through the KeyValue runtime surface, not `-spec`.
 */
export { CursorDebug } from './-u.cursor-debug.tsx';
export { useCursorKeyboardHandoff } from './-use.Cursor.ts';
