import type { t } from './common.ts';

type IPosition = t.Monaco.I.IPosition;
type IRange = t.Monaco.I.IRange;

export type * from './t.Path.ts';
export type * from './t.Use.ErrorMarkers.ts';
export type * from './t.Use.Yaml.ts';

/**
 * Tools for working with YAML in the code-editor.
 */
export type EditorYamlLib = Readonly<{
  Path: t.EditorYamlPathLib;
  Editor: React.FC<t.YamlEditorProps>;
  useYaml: t.UseEditorYaml;
  useErrorMarkers: t.UseYamlErrorMarkers;
}>;

/**
 * The position of the editor cursor within a YAML document.
 */
export type EditorYamlCursor = {
  readonly path: t.ObjectPath;
  readonly cursor?: { readonly position: IPosition; readonly offset: t.Index };
  readonly word?: IRange;
};
