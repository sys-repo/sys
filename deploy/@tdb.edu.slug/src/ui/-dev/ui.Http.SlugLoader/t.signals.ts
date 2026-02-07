import { type t } from './common.ts';

export type ActionProbeSignalsLib = {
  readonly create: ActionProbeSignalsFactory;
};

export type ActionProbeSignalsFactory = (
  defaults?: Partial<ActionProbeSignalsState>,
) => ActionProbeSignals;

export type ActionProbeSignals = {
  readonly props: ActionProbeSignalProps;
  start(probe: string): ActionProbeSignals;
  item(item: t.KeyValueItem): ActionProbeSignals;
  result(value: unknown): ActionProbeSignals;
  end(): ActionProbeSignals;
  reset(): ActionProbeSignals;
};

export type ActionProbeSignalProps = Readonly<{
  activeProbe: t.Signal<string | undefined>;
  resultItems: t.Signal<t.KeyValueItem[]>;
  response: t.Signal<unknown>;
  spinning: t.Signal<boolean>;
}>;

export type ActionProbeSignalsState = {
  activeProbe: string | undefined;
  resultItems: t.KeyValueItem[];
  response: unknown;
  spinning: boolean;
};
