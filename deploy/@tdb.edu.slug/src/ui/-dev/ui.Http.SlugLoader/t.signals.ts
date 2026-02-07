import { type t } from './common.ts';

/**
 *
 */
export type ActionProbeSignalsLib = {
  readonly create: ActionProbeSignalsFactory;
};

/**
 *
 */
export type ActionProbeSignalsFactory = (
  defaults?: Partial<ActionProbeSignalsState>,
) => ActionProbeSignals;

/**
 *
 */
export type ActionProbeSignals = {
  readonly props: ActionProbeSignalProps;
  start(probe: string): ActionProbeSignals;
  item(item: t.KeyValueItem): ActionProbeSignals;
  result(value: unknown): ActionProbeSignals;
  end(): ActionProbeSignals;
  reset(): ActionProbeSignals;
};

export type ActionProbeSignalProps = {
  readonly activeProbe: t.Signal<string | undefined>;
  readonly resultItems: t.Signal<t.KeyValueItem[]>;
  readonly response: t.Signal<unknown>;
  readonly spinning: t.Signal<boolean>;
};

export type ActionProbeSignalsState = {
  activeProbe: string | undefined;
  resultItems: t.KeyValueItem[];
  response: unknown;
  spinning: boolean;
};
