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
  start(probe: string): ActionProbeSignals;
  item(item: t.KeyValueItem): ActionProbeSignals;
  result(value: unknown): ActionProbeSignals;
  end(): ActionProbeSignals;
  reset(): ActionProbeSignals;
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
  };
};

/** Serializable snapshot shape for ActionProbe execution state. */
export type ActionProbeSignalsState = {
  spinning: boolean;
  probe: { active: string | undefined };
  result: { items: t.KeyValueItem[]; response: unknown };
};
