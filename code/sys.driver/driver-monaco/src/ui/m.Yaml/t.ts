import type { t } from './common.ts';
export type * from './t.Path.ts';

/**
 * Tools for working with YAML in the code-editor.
 */
export type EditorYamlLib = Readonly<{
  Path: t.EditorYamlPathLib;
}>;
