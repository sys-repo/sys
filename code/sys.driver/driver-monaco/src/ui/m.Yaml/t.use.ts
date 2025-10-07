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
export type EditorYamlHook = { readonly ok: boolean; readonly current?: t.EditorYaml };

/**
 * Sync Monaco error markers from YAML parser output.
 *
 * Wrapper that normalizes `YamlError` → `Diagnostic` and delegates
 * to the generic `useErrorMarkers`.
 */
export type UseYamlErrorMarkers = (args: UseYamlErrorMarkersArgs) => void;

/** Arguments for the YAML-specific wrapper. */
export type UseYamlErrorMarkersArgs = {
  enabled?: boolean;
  owner?: string;
  monaco?: t.Monaco.Monaco;
  editor?: t.Monaco.Editor;
  /** Raw YAML parser errors to normalize */
  errors?: readonly t.YamlError[];
};
