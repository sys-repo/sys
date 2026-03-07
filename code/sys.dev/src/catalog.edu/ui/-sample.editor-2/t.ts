import type { t } from './common.ts';

/**
 * Component:
 */
export type Sample2Props = {
  repo: t.Crdt.Repo;
  bus: Sample2Bus;
  signals: Sample2Signals;
  wordWrap?: boolean;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Sample parts:
 */
export type Sample2Bus = {
  left$: t.Subject<t.EditorEvent>;
  right$: t.Subject<t.EditorEvent>;
};
export type Sample2Signals = {
  left: Sample2EdgeSignals;
  right: Sample2EdgeSignals;
};
export type Sample2EdgeSignals = {
  doc: t.Signal<t.Crdt.Ref | undefined>;
  yaml: t.Signal<t.EditorYaml | undefined>;
  editor: t.Signal<t.Monaco.Editor | undefined>;
};
