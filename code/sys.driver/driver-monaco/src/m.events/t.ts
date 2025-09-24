import type { t } from './common.ts';

type IRange = t.Monaco.I.IRange;
type Base = {
  readonly trigger: 'editor' | 'crdt';
  readonly path: t.ObjectPath;
};

/**
 * Events (CRDT-centric): text + marks
 */
export type EditorEvent = EditorChangeText | EditorChangeMarks | EditorReadyText | EditorReadyMarks;

/** Fires when CRDT text changes (and is reflected in the editor). */
export type EditorChangeText = Base & {
  readonly kind: 'change:text';
  readonly change: { readonly before: string; readonly after: string };
};

/** Fires when CRDT mark ranges change (folds are a view of these). */
export type EditorChangeMarks = Base & {
  readonly kind: 'change:marks';
  readonly change: { readonly before: IRange[]; readonly after: IRange[] };
};

/** One-shot pulse when initial text is seeded and streams are live. */
export type EditorReadyText = {
  readonly kind: 'ready:text';
  readonly path: t.ObjectPath;
};

/** One-shot pulse when initial marks are applied (editor reflects CRDT). */
export type EditorReadyMarks = {
  readonly kind: 'ready:marks';
  readonly path: t.ObjectPath;
};
