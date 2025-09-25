import type { t } from './common.ts';

/**
 * Tools for working with selection path's in YAML.
 */
export type EditorYamlPathLib = Readonly<{
  /** Create a new `EditorYamlPathObserver`. */
  observe(
    args: { editor: t.Monaco.Editor; bus$?: t.EditorEventBus },
    until?: t.UntilInput,
  ): EditorYamlCursorPathObserver;
}>;

/**
 * Live observer of the [object-path] within an editor's
 * YAML document based on where the user's caret is.
 */
export type EditorYamlCursorPathObserver = t.Lifecycle & {
  readonly $: t.Observable<t.EditorChangeCursorPath>;
  readonly current: t.EditorChangeCursorPath;
};
