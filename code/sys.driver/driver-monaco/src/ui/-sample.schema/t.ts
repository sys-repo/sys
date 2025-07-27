import type { t } from './common.ts';

/**
 * Component:
 */
export type SampleProps = {
  signals: t.SampleSignals;
  repo?: t.Crdt.Repo;

  // Appearance:
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  // Events:
  onRequestRedraw?: () => void;
};

/**
 * Stateful Signals API:
 */
export type SampleState = t.UnwrapSignals<SampleSignals>;
export type SampleSignals = Readonly<{
  /** Code editor: */
  monaco: t.Signal<t.Monaco.Monaco | undefined>;
  editor: t.Signal<t.Monaco.Editor | undefined>;

  /** CRDT document store. */
  doc: t.Signal<t.Crdt.Ref | undefined>;
  /** Root path in the `doc` that the editor/yaml is written to. */
  root: t.Signal<t.ObjectPath>;
}>;
