import type { t } from './common.ts';

/**
 * Tools for working with selection path's in YAML.
 */
export type EditorYamlPathLib = Readonly<{
  /** Create a new `EditorYamlPathObserver`. */
  observe(editor: t.Monaco.Editor, dispose$?: t.UntilInput): EditorYamlPathObserver;
}>;

/**
 * Live observer of the [object-path] within an editor's
 * YAML document based on where the user's caret is.
 */
export type EditorYamlPathObserver = t.Lifecycle & {
  readonly $: t.Observable<t.EditorYamlPathChange>;
  readonly path: t.ObjectPath;
};

/**
 * Event: fires when the cursor/path changes.
 */
export type EditorYamlPathChangeHandler = (e: EditorYamlPathChange) => void;
/** Event information about the current cursor/path. */
export type EditorYamlPathChange = Readonly<{
  path: t.ObjectPath;
  cursor: Readonly<{ position: t.Monaco.I.IPosition; offset: t.Index }>;
}>;
