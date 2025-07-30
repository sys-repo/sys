import type { t } from './common.ts';
export type * from './t.Path.ts';
export type * from './t.Use.ErrorMarkers.ts';
export type * from './t.Use.Yaml.ts';

/**
 * Tools for working with YAML in the code-editor.
 */
export type EditorYamlLib = Readonly<{
  Path: t.EditorYamlPathLib;
  useYaml: t.UseEditorYaml;
  useErrorMarkers: t.UseYamlErrorMarkers;
}>;
