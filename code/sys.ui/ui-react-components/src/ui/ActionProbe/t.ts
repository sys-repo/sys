import type { t } from './common.ts';

type O = Record<string, unknown>;

import { ActionProbeProps, ActionResultProps } from './t.components.ts';

/** Type re-exports. */
export type * from './t.renderer.ts';
export type * from './t.signals.ts';

/**
 * ActionProbe:
 * A reusable probe surface for configuring and executing domain actions
 * with host-owned lifecycle state and shared result rendering.
 */
export namespace ActionProbe {
  export type Lib = {
    readonly Probe: t.ActionProbe.ProbeComponent;
    readonly Result: t.FC<t.ActionProbe.ResultProps>;
    readonly Signals: t.ActionProbeSignalsLib;
    readonly signals: t.ActionProbeSignalsLib['create'];
    readonly Renderer: t.ActionProbeRendererLib;
    readonly renderer: t.ActionProbeRendererLib['create'];
  };

  export type ProbeComponent = <TEnv extends O = O, TParams extends O = O>(
    props: t.ActionProbe.ProbeProps<TEnv, TParams>,
  ) => t.ReactNode;

  /**
   * Visual Components:
   */
  export type ActOn =
    | 'Cmd+Enter'
    | 'Enter'
    | null
    | readonly ('Cmd+Enter' | 'Enter' | null)[];
  export type ProbeProps<TEnv extends O = O, TParams extends O = O> = ActionProbeProps<
    TEnv,
    TParams
  >;
  export type ResultProps = ActionResultProps;

  /**
   * Probes:
   */
  export type ProbeSpec<TEnv extends O = O, TParams extends O = O> = {
    readonly title: t.ReactNode;
    readonly render: ProbeRender<TEnv, TParams>;
    readonly run?: ProbeRun<TEnv, TParams>;
  };

  export type ProbeRender<TEnv extends O = O, TParams extends O = O> = (
    e: ProbeRenderArgs<TEnv, TParams>,
  ) => void;
  export type ProbeRenderBlock =
    | { kind: 'element'; node: t.ReactNode }
    | { kind: 'kv'; items: t.KeyValueItem[] };
  export type ProbeRenderArgs<TEnv extends O = O, TParams extends O = O> = TEnv & {
    readonly theme?: t.CommonTheme;
    readonly params: (value: TParams) => ProbeRenderArgs<TEnv, TParams>;
    element(node: t.ReactNode): ProbeRenderArgs<TEnv, TParams>;
    item(item: t.KeyValueItem): ProbeRenderArgs<TEnv, TParams>;
    hr(): ProbeRenderArgs<TEnv, TParams>;
  };

  export type ProbeRun<TEnv extends O = O, TParams extends O = O> = (
    e: ProbeRunArgs<TEnv, TParams>,
  ) => Promise<void>;

  export type ProbeRunObjectConfig = Pick<t.ObjectViewProps, 'expand' | 'show' | 'sortKeys'>;

  export type ProbeRunArgs<TEnv extends O = O, TParams extends O = O> = TEnv & {
    readonly params: <T = TParams>() => Readonly<T> | undefined;
    obj(input: ProbeRunObjectConfig): ProbeRunArgs<TEnv, TParams>;
    item(item: t.KeyValueItem): ProbeRunArgs<TEnv, TParams>;
    hr(): ProbeRunArgs<TEnv, TParams>;
    readonly result: (value: unknown) => void;
  };
}
