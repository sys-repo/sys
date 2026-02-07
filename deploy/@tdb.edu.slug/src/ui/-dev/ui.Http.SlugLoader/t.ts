import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.signals.ts';

/**
 * ActionProbe:
 * A reusable probe surface for configuring and executing domain actions
 * with host-owned lifecycle state and shared result rendering.
 */
export namespace ActionProbe {
  type EnvObject = Record<string, unknown>;
  type ParamsObject = Record<string, unknown>;

  export type Lib = {
    readonly Probe: t.ActionProbe.ProbeComponent;
    readonly Result: t.FC<t.ActionProbe.ResultProps>;
    readonly Signals: t.ActionProbeSignalsLib;
    readonly signals: t.ActionProbeSignalsLib['create'];
  };

  export type ProbeComponent = <
    TEnv extends EnvObject = EnvObject,
    TParams extends ParamsObject = ParamsObject,
  >(
    props: t.ActionProbe.ProbeProps<TEnv, TParams>,
  ) => t.ReactNode;

  /**
   * Component:
   */
  export type ProbeProps<
    TEnv extends EnvObject = EnvObject,
    TParams extends ParamsObject = ParamsObject,
  > = {
    sample: t.ActionProbe.ProbeSpec<TEnv, TParams>;
    env: TEnv;
    spinning?: boolean;
    onRunStart?: () => void;
    onRunEnd?: () => void;
    onRunResult?: (value: unknown) => void;
    onRunItem?: (item: t.KeyValueItem) => void;

    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };
  export type ResultProps = {
    spinning?: boolean;
    response?: unknown;
    items?: readonly t.KeyValueItem[];
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };

  /**
   * Fetch Samples
   */
  export type ProbeSpec<
    TEnv extends EnvObject = EnvObject,
    TParams extends ParamsObject = ParamsObject,
  > = {
    readonly title: t.ReactNode;
    readonly render: ProbeRender<TEnv, TParams>;
    readonly run?: ProbeRun<TEnv, TParams>;
  };

  export type ProbeRender<
    TEnv extends EnvObject = EnvObject,
    TParams extends ParamsObject = ParamsObject,
  > = (
    e: ProbeRenderArgs<TEnv, TParams>,
  ) => t.ReactNode | null;
  export type ProbeRenderArgs<
    TEnv extends EnvObject = EnvObject,
    TParams extends ParamsObject = ParamsObject,
  > = TEnv & {
    readonly theme?: t.CommonTheme;
    readonly params: (value: TParams) => ProbeRenderArgs<TEnv, TParams>;
    item(item: t.KeyValueItem): ProbeRenderArgs<TEnv, TParams>;
  };

  export type ProbeRun<
    TEnv extends EnvObject = EnvObject,
    TParams extends ParamsObject = ParamsObject,
  > = (
    e: ProbeRunArgs<TEnv, TParams>,
  ) => Promise<void>;
  export type ProbeRunArgs<
    TEnv extends EnvObject = EnvObject,
    TParams extends ParamsObject = ParamsObject,
  > = TEnv & {
    readonly params: <T = TParams>() => Readonly<T> | undefined;
    item(item: t.KeyValueItem): ProbeRunArgs<TEnv, TParams>;
    readonly result: (value: unknown) => void;
  };
}
