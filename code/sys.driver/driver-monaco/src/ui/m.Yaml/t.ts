import type { t } from './common.ts';
export type * from './t.Path.ts';

/**
 * Tools for working with YAML in the code-editor.
 */
export type EditorYamlLib = Readonly<{
  Path: t.EditorYamlPathLib;
  useYaml: t.UseEditorYaml;
}>;

/**
 * Factory for instances of the Yaml parser.
 */
export type UseEditorYaml = (
  args: UseEditorYamlArgs,
  cb?: t.EditorYamlEventHandler,
) => t.EditorYaml;

/** Arguments passed to the `useYaml` hook. */
export type UseEditorYamlArgs = Partial<Omit<t.YamlSyncArgsInput, 'dispose$'>> & {
  editor?: t.Monaco.Editor;
};

/** A YAML hook instance. */
export type EditorYaml = {
  readonly ok: boolean;
  readonly path?: t.YamlSyncParserPaths;
  readonly cursor: t.EditorYamlCursorPath;
  readonly parsed: Readonly<{
    input: string;
    output: t.YamSyncParsed<unknown>;
    errors: t.StdError[];
  }>;
};

/**
 * Events:
 */
export type EditorYamlEventHandler = (e: EditorYamlEvent) => void;
export type EditorYamlEvent = EditorYaml;
