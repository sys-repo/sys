import type { t } from './common.ts';

/** YAML sync/parsing hook. */
export type Use = (args: Args) => Result;

/** Arguments passed to the `useYaml` hook. */
export type Args = Partial<Omit<t.YamlSyncArgsInput, 'dispose$'>> & {
  /** Event-bus. */
  bus$?: t.EditorBus.Subject;
  /** Monaco API instance. */
  monaco?: t.Monaco.Monaco;
  /** Editor instance. */
  editor?: t.Monaco.Editor;
  /** Render red squiggles from YAML errors. */
  errorMarkers?: boolean;
};

/** A YAML hook instance. */
export type Result = { readonly ok: boolean; readonly current?: t.EditorYaml.State };

/** Synchronize Monaco editor markers from YAML diagnostics. */
export type UseErrorMarkers = (args: UseErrorMarkersArgs) => void;

/** Arguments for `useYamlErrorMarkers`. */
export type UseErrorMarkersArgs = {
  /** Enable or disable marker updates. */
  readonly enabled?: boolean;

  /** Marker owner ID. */
  readonly owner?: string;

  /** Monaco API instance. */
  readonly monaco?: t.Monaco.Monaco;

  /** Monaco editor instance to attach markers to. */
  readonly editor?: t.Monaco.Editor;

  /** YAML issues to render as Monaco markers. */
  readonly errors?: t.Ary<t.Yaml.Diagnostic | t.Yaml.Error>;
};
