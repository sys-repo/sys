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
 * Synchronize Monaco editor markers from YAML diagnostics.
 *
 * Converts YAML validation output into Monaco-compatible markers
 * and delegates to the generic `useErrorMarkers` hook.
 * Accepts parser, schema, or semantic diagnostics.
 */
export type UseYamlErrorMarkers = (args: UseYamlErrorMarkersArgs) => void;

/** Arguments for `useYamlErrorMarkers`. */
export type UseYamlErrorMarkersArgs = {
  /** Enable or disable marker updates. */
  readonly enabled?: boolean;

  /** Marker owner ID (used to isolate editor decorations). */
  readonly owner?: string;

  /** Monaco API instance. */
  readonly monaco?: t.Monaco.Monaco;

  /** Monaco editor instance to attach markers to. */
  readonly editor?: t.Monaco.Editor;

  /**
   * YAML issues to render as Monaco markers.
   * - Accepts normalized diagnostics (`Yaml.Diagnostic[]`) or raw parser errors (`Yaml.Error[]`).
   * - Mixed arrays are allowed; items are normalized per-element.
   */
  readonly errors?: (t.Yaml.Diagnostic | t.Yaml.Error)[];
};
