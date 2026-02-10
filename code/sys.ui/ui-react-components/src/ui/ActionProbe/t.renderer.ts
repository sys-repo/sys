import type { t } from './common.ts';

/** ActionProbe renderer library. */
export type ActionProbeRendererLib = {
  readonly create: ActionProbeRendererFactory;
};

/** Factory that creates an ActionProbe probe-list renderer. */
export type ActionProbeRendererFactory = <
  TState,
  TEnv extends Record<string, unknown> = Record<string, unknown>,
>(
  args: ActionProbeRendererFactoryArgs<TState, TEnv>,
) => ActionProbeRenderer<TEnv>;

/** Immutable renderer for an ordered list of ActionProbe specs. */
export type ActionProbeRenderer<TEnv extends Record<string, unknown>> = {
  readonly items: t.ReactNode[];
  push<TParams extends Record<string, unknown> = Record<string, unknown>>(
    spec: t.ActionProbe.ProbeSpec<TEnv, TParams>,
  ): ActionProbeRenderer<TEnv>;
  hr(): ActionProbeRenderer<TEnv>;
};

/** Input arguments for creating an ActionProbe renderer. */
export type ActionProbeRendererFactoryArgs<TState, TEnv extends Record<string, unknown>> = {
  readonly state: TState;
  readonly style?: t.CssInput;
  readonly resolve: (
    args: ActionProbeRendererResolveArgs<TState>,
  ) => ActionProbeRendererResolvedProps<TEnv> | undefined;
};

/** Resolve arguments passed for each pushed probe spec. */
export type ActionProbeRendererResolveArgs<TState> = {
  readonly state: TState;
  readonly index: t.Index;
  readonly probe: string;
};

/** Computed props used to render each ActionProbe.Probe instance. */
export type ActionProbeRendererResolvedProps<TEnv extends Record<string, unknown>> = {
  readonly env: TEnv;
  readonly spinning?: boolean;
  readonly focused?: boolean;
  readonly actOn?: t.ActionProbe.ActOn;
  readonly theme?: t.CommonTheme;
  readonly debug?: boolean;
  readonly onRunStart?: (args?: t.ActionProbeRunStartArgs) => void;
  readonly onRunEnd?: () => void;
  readonly onRunResult?: (value: unknown, obj?: t.ActionProbe.ProbeRunObjectConfig) => void;
  readonly onRunItem?: (item: t.KeyValueItem) => void;
  readonly onFocus?: () => void;
  readonly onBlur?: () => void;
};
