import type { t } from './common.ts';

/**
 * Factory for instances of the Yaml parser.
 */
export type UseEditorYaml = (
  args: UseEditorYamlArgs,
  cb?: t.EditorYamlEventHandler,
) => t.EditorYaml;

/** Arguments passed to the `useYaml` hook. */
export type UseEditorYamlArgs = Partial<Omit<t.YamlSyncArgsInput, 'dispose$'>> & {
  monaco?: t.Monaco.Monaco;
  editor?: t.Monaco.Editor;
  /** Render red squiggles from YAML errors. (default = off) */
  errorMarkers?: boolean;
};

/** A YAML hook instance. */
export type EditorYaml = {
  readonly ok: boolean;
  readonly path?: t.YamlSyncParserPaths;
  readonly cursor: t.EditorYamlCursorPath;
  readonly parsed: Readonly<{
    input: string;
    output: t.YamlSyncParsed<unknown>;
    errors: t.YamlError[];
  }>;
};

/**
 * Events:
 */
export type EditorYamlEventHandler = (e: EditorYamlEvent) => void;
export type EditorYamlEvent = EditorYaml;
