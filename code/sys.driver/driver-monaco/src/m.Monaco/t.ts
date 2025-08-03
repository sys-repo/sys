import type { PathViewProps } from '@sys/ui-react-components/t';
import type { t } from './common.ts';

/**
 * Code editor library:
 */
export type MonacoLib = Readonly<{
  Is: t.MonacoIsLib;
  Editor: React.FC<t.MonacoEditorProps>;
  Carets: t.EditorCaretsLib;
  Crdt: t.EditorCrdtLib;
  Yaml: t.EditorYamlLib;
  Folding: t.EditorFoldingLib;
  Dev: t.MonacoDevLib;
}>;

/**
 * Boolean flag evalutators for the Monaco UI library.
 */
export type MonacoIsLib = Readonly<{
  editorRange(input: unknown): input is t.Monaco.I.IRange;
  charPositionTuple(input: any): input is t.CharPositionTuple;
  nullRange(input: t.Monaco.I.IRange): boolean;
  singleCharRange(input: t.EditorRangeInput): boolean;
  rangeWithinString(input: t.EditorRangeInput, text: string): boolean;
}>;
