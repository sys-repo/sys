import type { t } from './common.ts';

export type * from './t.Path.ts';
export type * from './t.Use.ErrorMarkers.ts';
export type * from './t.Use.Yaml.ts';

/**
 * Tools for working with YAML in the code-editor.
 */
export type EditorYamlLib = {
  readonly Path: t.EditorYamlPathLib;
  readonly Editor: React.FC<t.YamlEditorProps>;
  useYaml: t.UseEditorYaml;
  useErrorMarkers: t.UseYamlErrorMarkers;
};

/** The canonical YAML data related to a loaded editor document. */
export type EditorYaml = {
  readonly rev: number; // Monotonic revision counter.
  readonly cursor: t.EditorCursor;
  readonly parsed: t.YamlSyncParseResult;
};
