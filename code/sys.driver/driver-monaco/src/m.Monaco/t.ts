import type { t } from './common.ts';

export type * from './t.Error.ts';
export type * from './t.Link.ts';

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
 * Boolean flag evalutators for the Monaco UI library.
 */
export type EditorIsLib = Readonly<{
  editorRange(input: unknown): input is t.Monaco.I.IRange;
  charPositionTuple(input: any): input is t.CharPositionTuple;
  nullRange(input: t.Monaco.I.IRange): boolean;
  singleCharRange(input: t.EditorRangeInput): boolean;
  rangeWithinString(input: t.EditorRangeInput, text: string): boolean;
}>;

/**
 * Convenince bundling of the Editor with the global Monaco API
 * for passing to functions as a single parameter.
 */
export type MonacoCtx = {
  readonly editor: t.Monaco.Editor;
  readonly monaco: t.Monaco.Monaco;
};
