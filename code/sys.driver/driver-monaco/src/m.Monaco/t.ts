// import React from '@types/react';
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
  Hidden: t.EditorHiddenLib;
  useBinding: t.UseEditorCrdtBinding;
  Dev: Readonly<{
    PathView: React.FC<t.PathViewProps>;
  }>;
}>;

/**
 * Boolean flag evalutators for the Monaco UI library.
 */
export type MonacoIsLib = Readonly<{
  editorRange(input: unknown): input is t.EditorRange;
  charPositionTuple(input: any): input is t.CharPositionTuple;
  nullRange(input: t.EditorRange): boolean;
  singleCharRange(input: t.EditorRangeInput): boolean;
  rangeWithinString(input: t.EditorRangeInput, text: string): boolean;
}>;
