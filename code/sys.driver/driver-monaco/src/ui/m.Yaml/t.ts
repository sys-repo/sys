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
export type UseEditorYaml = (args: UseEditorYamlArgs) => t.EditorYamlHook;
export type UseEditorYamlArgs = Partial<Omit<t.YamlSyncArgsInput, 'dispose$'>>;
export type EditorYamlHook = Readonly<{
  ok: boolean;
  doc?: t.YamlSyncParserDocs;
  path?: t.YamlSyncParserPaths;
  parsed: Readonly<{
    input: string;
    output: t.YamSyncParsed<unknown>;
    errors: t.StdError[];
  }>;
}>;
