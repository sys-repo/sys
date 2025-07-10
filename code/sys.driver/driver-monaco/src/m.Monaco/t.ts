import type { t } from './common.ts';

/**
 * Code editor library:
 */
export type MonacoLib = {
  readonly Is: t.MonacoIsLib;
  readonly Editor: React.FC<t.MonacoEditorProps>;
  readonly Carets: t.EditorCaretsLib;
  readonly useBinding: t.UseEditorCrdtBinding;
};

/**
 * Boolean flag evalutators for the Monaco UI library.
 */
export type MonacoIsLib = {
  editorRange(input: unknown): input is t.EditorRange;
  charPositionTuple(input: any): input is t.CharPositionTuple;
  nullRange(input: t.EditorRange): boolean;
  singleCharRange(input: t.EditorRangeInput): boolean;
  rangeWithinString(input: t.EditorRangeInput, text: string): boolean;
};
