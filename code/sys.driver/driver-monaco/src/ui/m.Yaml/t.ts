import type { t } from './common.ts';

export type * from './t.Error.ts';
export type * from './t.Path.ts';
export type * from './t.Use.ErrorMarkers.ts';
export type * from './t.Use.Yaml.ts';

/**
 * Tools for working with YAML in the code-editor.
 */
export type EditorYamlLib = {
  readonly Path: t.EditorYamlPathLib;
  readonly Editor: React.FC<t.YamlEditorProps>;
  readonly Error: t.EditorYamlErrorLib;
  useYaml: t.UseEditorYaml;
  useErrorMarkers: t.UseYamlErrorMarkers;
};

/**
 * Canonical representation of YAML state for an
 * active editor document.
 */
export type EditorYaml = {
  /** Monotonic revision counter. */
  readonly rev: number;
  /** The parsed data ("what"). */
  readonly data: t.YamlSyncParsed;
  /** The current cursor location within the document ("where"). */
  readonly cursor: t.EditorCursor;
};
