import type { t } from './common.ts';
export type * from './t.factory.ts';

type O = Record<string, unknown>;

/**
 * Component:
 */
export type SampleProps = {
  factory: t.Factory;
  signals: t.SampleSignals;
  repo?: t.CrdtRepo;

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
  io: Readonly<{
    monaco: t.Signal<t.Monaco.Monaco | undefined>;
    editor: t.Signal<t.Monaco.Editor | undefined>;
  }>;

  /** Root paths to landmarks within `doc`. */
  paths: t.SamplePathsSignals;
  /** CRDT document store. */
  doc: t.Signal<t.Crdt.Ref | undefined>;
  /** CRDT → Parsed Yaml. */
  yaml: t.Signal<t.EditorYaml | undefined>;
  /** Factory/props information for the <Main> view renderer. */
  main: t.Signal<SampleSignalsFactoryDef | undefined>;
  /** Hook into signal values. */
  listen(): void;
}>;

/** The main view */
export type SampleSignalsFactoryDef = {
  component: string;
  props: O;
};

/**
 * CRDT Path Addresses:
 */
export type SamplePaths = {
  /** Path in the `doc` that the editor/yaml text is written to. */
  yaml: t.ObjectPath;
  /** Path to where the parsed YAML is written to. */
  parsed: t.ObjectPath;
  /** Path to where the meta-data about the YAML document is located within the document. */
  meta: t.ObjectPath;
};

export type SamplePathsSignals = t.WrapSignals<SamplePaths>;
