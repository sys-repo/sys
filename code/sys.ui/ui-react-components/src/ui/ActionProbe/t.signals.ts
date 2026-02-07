import { type t } from './common.ts';

/** ActionProbe signals library. */
export type ActionProbeSignalsLib = {
  readonly create: ActionProbeSignalsFactory;
};

/** Factory that creates an ActionProbe signals instance. */
export type ActionProbeSignalsFactory = (
  defaults?: Partial<ActionProbeSignalsState>,
) => ActionProbeSignals;

/** Mutable execution-state API for ActionProbe hosts. */
export type ActionProbeSignals = {
  readonly props: ActionProbeSignalProps;
  handlers(probe: string, title?: t.ReactNode): ActionProbeRunHandlers;
  start(probe: string, title?: t.ReactNode): ActionProbeSignals;
  item(item: t.KeyValueItem): ActionProbeSignals;
  result(value: unknown, obj?: t.ActionProbe.ProbeRunObjectConfig): ActionProbeSignals;
  end(): ActionProbeSignals;
  reset(): ActionProbeSignals;
};

/** ActionProbe run-event handlers bound to a probe id. */
export type ActionProbeRunHandlers = {
  readonly onRunStart: () => void;
  readonly onRunEnd: () => void;
  readonly onRunResult: (value: unknown, obj?: t.ActionProbe.ProbeRunObjectConfig) => void;
  readonly onRunItem: (item: t.KeyValueItem) => void;
};

/** Raw signal handles used by the execution-state API. */
export type ActionProbeSignalProps = {
  readonly spinning: t.Signal<boolean>;
  readonly probe: {
    readonly active: t.Signal<string | undefined>;
  };
  readonly result: {
    readonly items: t.Signal<t.KeyValueItem[]>;
    readonly response: t.Signal<unknown>;
    readonly obj: t.Signal<t.ActionProbe.ProbeRunObjectConfig | undefined>;
  };
};

/** Serializable snapshot shape for ActionProbe execution state. */
export type ActionProbeSignalsState = {
  spinning: boolean;
  probe: { active: string | undefined };
  result: {
    items: t.KeyValueItem[];
    response: unknown;
    obj: t.ActionProbe.ProbeRunObjectConfig | undefined;
  };
};
