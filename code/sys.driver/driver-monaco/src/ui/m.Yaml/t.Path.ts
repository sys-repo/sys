import type { t } from './common.ts';

/**
 * Tools for working with selection path's in YAML.
 */
export type EditorYamlPathLib = Readonly<{
  /** Create a new `EditorYamlPathObserver`. */
  observe(editor: t.Monaco.Editor, dispose$?: t.UntilInput): EditorYamlCursorPathObserver;
}>;

/**
 * Live observer of the [object-path] within an editor's
 * YAML document based on where the user's caret is.
 */
export type EditorYamlCursorPathObserver = t.Lifecycle & {
  readonly $: t.Observable<t.EditorYamlCursorPath>;
  readonly current: t.EditorYamlCursorPath;
};

/**
 * Event: fires when the cursor/path changes.
 */
export type EditorYamlCursorPathHandler = (e: EditorYamlCursorPath) => void;
/** Event information about the current cursor/path. */
export type EditorYamlCursorPath = {
  readonly path: t.ObjectPath;
  readonly cursor?: Readonly<{ position: t.Monaco.I.IPosition; offset: t.Index }>;
};
