import { type t } from './common.ts';

/** ActionProbe signals library. */
export type ActionProbeSignalsLib = {
  readonly create: ActionProbeSignalsFactory;
};

/** Factory that creates an ActionProbe signals instance. */
export type ActionProbeSignalsFactory = <TPersist extends t.JsonMapU = t.JsonMapU>(
  input?: Partial<ActionProbeSignalsState> | ActionProbeSignalsCreateArgs<TPersist>,
) => ActionProbeSignals;

/** Optional create-time behavior for ActionProbe signals. */
export type ActionProbeSignalsCreateArgs<TPersist extends t.JsonMapU = t.JsonMapU> = {
  readonly defaults?: Partial<ActionProbeSignalsState>;
  readonly persist?: t.ImmutableRef<TPersist>;
  readonly persistKey?: string;
};

/** Mutable execution-state API for ActionProbe hosts. */
export type ActionProbeSignals = {
  readonly props: ActionProbeSignalProps;
  handlers(probe: string, title?: t.ReactNode): ActionProbeRunHandlers;
  start(probe: string, title?: t.ReactNode): ActionProbeSignals;
  focus(probe: string, title?: t.ReactNode): ActionProbeSignals;
  blur(probe?: string): ActionProbeSignals;
  resultVisible(next: boolean | ((prev: boolean) => boolean)): ActionProbeSignals;
  item(item: t.KeyValueItem): ActionProbeSignals;
  result(value: unknown, obj?: t.ActionProbe.ProbeRunObjectConfig): ActionProbeSignals;
  end(): ActionProbeSignals;
  reset(): ActionProbeSignals;
};

export type ActionProbeResultSnapshot = {
  title: t.ReactNode | undefined;
  items: t.KeyValueItem[];
  response: unknown;
  obj: t.ActionProbe.ProbeRunObjectConfig | undefined;
};

/** ActionProbe run-event handlers bound to a probe id. */
export type ActionProbeRunStartArgs = {
  readonly title?: t.ReactNode;
};

/** ActionProbe run-event handlers bound to a probe id. */
export type ActionProbeRunHandlers = {
  readonly onRunStart: (args?: ActionProbeRunStartArgs) => void;
  readonly onRunTitle: (title: t.ReactNode) => void;
  readonly onRunEnd: () => void;
  readonly onRunResult: (value: unknown, obj?: t.ActionProbe.ProbeRunObjectConfig) => void;
  readonly onRunItem: (item: t.KeyValueItem) => void;
};

/** Raw signal handles used by the execution-state API. */
export type ActionProbeSignalProps = {
  readonly spinning: t.Signal<boolean>;
  readonly probe: {
    readonly active: t.Signal<string | undefined>;
    readonly focused: t.Signal<string | undefined>;
  };
  readonly result: {
    readonly title: t.Signal<t.ReactNode | undefined>;
    readonly visible: t.Signal<boolean>;
    readonly items: t.Signal<t.KeyValueItem[]>;
    readonly response: t.Signal<unknown>;
    readonly obj: t.Signal<t.ActionProbe.ProbeRunObjectConfig | undefined>;
    readonly byProbe: t.Signal<Record<string, ActionProbeResultSnapshot>>;
  };
};

/** Serializable snapshot shape for ActionProbe execution state. */
export type ActionProbeSignalsState = {
  spinning: boolean;
  probe: { active: string | undefined; focused: string | undefined };
  result: {
    title: t.ReactNode | undefined;
    visible: boolean;
    items: t.KeyValueItem[];
    response: unknown;
    obj: t.ActionProbe.ProbeRunObjectConfig | undefined;
    byProbe: Record<string, ActionProbeResultSnapshot>;
  };
};
