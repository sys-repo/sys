import { type t } from './common.ts';

export namespace ActionProbe {
  /** ActionProbe signals library. */
  export type SignalsLib = {
    readonly create: SignalsFactory;
  };

  /** Factory that creates an ActionProbe signals instance. */
  export type SignalsFactory = <TPersist extends t.JsonMapU = t.JsonMapU>(
    input?: Partial<SignalsState> | SignalsCreateArgs<TPersist>,
  ) => Signals;

  /** Optional create-time behavior for ActionProbe signals. */
  export type SignalsCreateArgs<TPersist extends t.JsonMapU = t.JsonMapU> = {
    readonly defaults?: Partial<SignalsState>;
    readonly persist?: t.ImmutableRef<TPersist>;
    readonly persistKey?: string;
  };

  /** Mutable execution-state API for ActionProbe hosts. */
  export type Signals = {
    readonly props: SignalProps;
    handlers(probe: string, title?: t.ReactNode): RunHandlers;
    start(probe: string, title?: t.ReactNode): Signals;
    focus(probe: string, title?: t.ReactNode): Signals;
    blur(probe?: string): Signals;
    resultVisible(next: boolean | ((prev: boolean) => boolean)): Signals;
    item(item: t.KeyValueItem): Signals;
    result(value: unknown, obj?: t.ActionProbe.ProbeRunObjectConfig): Signals;
    end(): Signals;
    reset(): Signals;
  };

  export type ResultSnapshot = {
    title: t.ReactNode | undefined;
    items: t.KeyValueItem[];
    response: unknown;
    obj: t.ActionProbe.ProbeRunObjectConfig | undefined;
  };

  /** ActionProbe run-event handlers bound to a probe id. */
  export type RunStartArgs = {
    readonly title?: t.ReactNode;
  };

  /** ActionProbe run-event handlers bound to a probe id. */
  export type RunHandlers = {
    readonly onRunStart: (args?: RunStartArgs) => void;
    readonly onRunTitle: (title: t.ReactNode) => void;
    readonly onRunEnd: () => void;
    readonly onRunResult: (value: unknown, obj?: t.ActionProbe.ProbeRunObjectConfig) => void;
    readonly onRunItem: (item: t.KeyValueItem) => void;
  };

  /** Raw signal handles used by the execution-state API. */
  export type SignalProps = {
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
      readonly byProbe: t.Signal<Record<string, ResultSnapshot>>;
    };
  };

  /** Serializable snapshot shape for ActionProbe execution state. */
  export type SignalsState = {
    spinning: boolean;
    probe: { active: string | undefined; focused: string | undefined };
    result: {
      title: t.ReactNode | undefined;
      visible: boolean;
      items: t.KeyValueItem[];
      response: unknown;
      obj: t.ActionProbe.ProbeRunObjectConfig | undefined;
      byProbe: Record<string, ResultSnapshot>;
    };
  };
}
