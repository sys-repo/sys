import type { t } from './common.ts';
export type * from './t.Link.ts';

type IRange = t.Monaco.I.IRange;
type IPosition = t.Monaco.I.IPosition;

/**
 * Convenince bundling of the Editor with the global Monaco API
 * for passing to functions as a single parameter.
 */
export type MonacoCtx = {
  readonly editor: t.Monaco.Editor;
  readonly monaco: t.Monaco.Monaco;
};

/**
 * Code editor library:
 */
export type MonacoLib = {
  readonly Bus: t.EditorBusLib;
  readonly Editor: React.FC<t.MonacoEditorProps>;
  readonly Is: t.EditorIsLib;
  readonly Crdt: t.EditorCrdtLib;
  readonly Yaml: t.EditorYamlLib;
  readonly Link: t.EditorLinkLib;
  readonly Error: t.EditorErrorLib;
};

/**
 * The position of the editor cursor within a YAML document.
 */
export type EditorCursor = {
  /** The Editor the cursor position pretains to. */
  readonly editorId: t.StringId;
  /** The calculated path within the parsed document of where the cursor currently is. */
  readonly path: t.ObjectPath;
  /** The caret position within the text (line/column). */
  readonly position?: IPosition;
  /** Absolute character offset into the document. */
  readonly offset?: t.Index;
  /** The word under the caret (if resolved). */
  readonly word?: IRange;
};
