import type { t } from './common.ts';
export type * from './t.Bus.ts';

type IRange = t.Monaco.I.IRange;
type Base = {
  readonly trigger: 'editor' | 'crdt';
  readonly path: t.ObjectPath;
};

/**
 * Events (CRDT-centric): text + marks
 */
export type EditorEvent =
  | EditorChangeText
  | EditorChangeMarks
  | EditorReadyText
  | EditorReadyMarks
  | EditorChangeCursorPath
  | EditorChangeFoldingArea;
export type EditorEventBus = t.Subject<t.EditorEvent>;

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

/**
 * Event: fires when the cursor/path changes.
 */
export type EditorChangeCursorPathHandler = (e: EditorChangeCursorPath) => void;
/** Event information about the current cursor/path. */
export type EditorChangeCursorPath = {
  readonly kind: 'change:cursor-path';
  readonly path: t.ObjectPath;
  readonly cursor?: Readonly<{ position: t.Monaco.I.IPosition; offset: t.Index }>;
  readonly word?: t.Monaco.I.IRange;
};

/**
 * Event: fires when the editor's hidden-area list changes.
 */
export type EditorChangeFoldingAreaHandler = (e: EditorChangeFoldingArea) => void;
/** Event information about the change. */
export type EditorChangeFoldingArea = {
  readonly kind: 'change:folding-area';
  readonly areas: t.Monaco.I.IRange[];
};
