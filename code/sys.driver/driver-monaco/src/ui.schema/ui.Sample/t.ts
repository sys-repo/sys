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
};

/**
 * Stateful Signals API:
 */
export type SampleState = t.UnwrapSignals<SampleSignals>;
export type SampleSignals = Readonly<{
  editor: t.Signal<t.Monaco.Editor | undefined>;
  doc: t.Signal<t.Crdt.Ref | undefined>;
  'yaml.path': t.Signal<t.ObjectPath>;
}>;
