import type { t } from './common.ts';

/**
 * Yaml sync/parsing hook.
 */
export type UseEditorYaml = (args: UseEditorYamlArgs) => t.EditorYamlHook;

/** Arguments passed to the `useYaml` hook. */
export type UseEditorYamlArgs = Partial<Omit<t.YamlSyncArgsInput, 'dispose$'>> & {
  /** Event-bus */
  bus$?: t.EditorEventBus;
  /** Editor instance: */
  monaco?: t.Monaco.Monaco;
  editor?: t.Monaco.Editor;
  /** Render red squiggles from YAML errors. (default = off) */
  errorMarkers?: boolean;
};

/** A YAML hook instance. */
export type EditorYamlHook = {
  readonly ok: boolean;
  readonly current?: {
    readonly rev: number; // Monotonic revision counter.
    readonly cursor: t.EditorCursor;
    readonly parsed: t.YamlSyncParseResult;
  };
};
