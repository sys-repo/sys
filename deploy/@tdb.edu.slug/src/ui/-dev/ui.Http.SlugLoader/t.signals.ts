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
  readonly activeProbe: t.Signal<string | undefined>;
  readonly resultItems: t.Signal<t.KeyValueItem[]>;
  readonly response: t.Signal<unknown>;
  readonly spinning: t.Signal<boolean>;
};

/** Serializable snapshot shape for ActionProbe execution state. */
export type ActionProbeSignalsState = {
  activeProbe: string | undefined;
  resultItems: t.KeyValueItem[];
  response: unknown;
  spinning: boolean;
};
