import type { t } from './common.ts';
export type * from './t.Links.ts';

/**
 * Code editor library:
 */
export type MonacoLib = Readonly<{
  Editor: React.FC<t.MonacoEditorProps>;
  Is: t.EditorIsLib;
  Crdt: t.EditorCrdtLib;
  Yaml: t.EditorYamlLib;
  Link: t.EditorLinkLib;
}>;

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
