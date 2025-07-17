import type { t } from './common.ts';

/**
 * Tools for working with YAML in the code-editor.
 */
export type EditorYamlLib = Readonly<{
  /** Create a new `EditorYamlPathObserver`. */
  observePath(editor: t.Monaco.Editor, dispose$?: t.UntilInput): EditorYamlPathObserver;
}>;

/**
 * Live observer of the [object-path] within an editor's
 * YAML document based on where the user's caret is.
 */
export type EditorYamlPathObserver = t.Lifecycle & {
  readonly $: t.Observable<t.EditorYamlPathObserverEvent>;
  readonly path: t.ObjectPath;
};

/**
 * Event: fires when the cursor/path changes.
 */
export type EditorYamlPathObserverHandler = (e: EditorYamlPathObserverEvent) => void;
/** Event information about the current cursor/path. */
export type EditorYamlPathObserverEvent = Readonly<{
  path: t.ObjectPath;
  cursor: Readonly<{
    position: t.Monaco.IPosition;
    offset: t.Index;
  }>;
}>;
