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
  /** Public ActionProbe module surface (components, signals, and renderer helpers). */
  export type Lib = {
    readonly Probe: t.ActionProbe.ProbeComponent;
    readonly Result: t.FC<t.ActionProbe.ResultProps>;
    readonly Signals: t.ActionProbeSignalsLib;
    readonly signals: t.ActionProbeSignalsLib['create'];
    readonly Renderer: t.ActionProbeRendererLib;
    readonly renderer: t.ActionProbeRendererLib['create'];
  };

  /** Generic React component type for rendering a probe bound to env and params shapes. */
  export type ProbeComponent = <TEnv extends O = O, TParams extends O = O>(
    props: t.ActionProbe.ProbeProps<TEnv, TParams>,
  ) => t.ReactNode;

  /**
   * Visual Components:
   */
  export type ActOnKey = 'Cmd+Enter' | 'Cmd+Click' | 'Enter';
  /** Supported trigger configuration for running probes from keyboard and pointer gestures. */
  export type ActOn = ActOnKey | null | readonly (ActOnKey | null)[];
  /** Props accepted by the interactive probe surface component. */
  export type ProbeProps<TEnv extends O = O, TParams extends O = O> = ActionProbeProps<
    TEnv,
    TParams
  >;
  /** Props accepted by the probe result renderer component. */
  export type ResultProps = ActionResultProps;

  /**
   * Probes:
   */
  export type ProbeSpec<TEnv extends O = O, TParams extends O = O> = {
    readonly title: t.ReactNode;
    readonly render: ProbeRender<TEnv, TParams>;
    readonly run?: ProbeRun<TEnv, TParams>;
  };

  /** Render callback used to build the probe preview body before execution. */
  export type ProbeRender<TEnv extends O = O, TParams extends O = O> = (
    e: ProbeRenderArgs<TEnv, TParams>,
  ) => void;
  /** Rendered block variants emitted by probe renderers. */
  export type ProbeRenderBlock =
    | { kind: 'element'; node: t.ReactNode }
    | { kind: 'kv'; items: t.KeyValueItem[] };
  /** Builder API provided to probe render callbacks for composing preview output. */
  export type ProbeRenderArgs<TEnv extends O = O, TParams extends O = O> = TEnv & {
    readonly theme?: t.CommonTheme;
    readonly params: (value: TParams) => ProbeRenderArgs<TEnv, TParams>;
    element(node: t.ReactNode): ProbeRenderArgs<TEnv, TParams>;
    item(item: t.KeyValueItem): ProbeRenderArgs<TEnv, TParams>;
    hr(): ProbeRenderArgs<TEnv, TParams>;
  };

  /** Async run callback invoked when a probe is executed. */
  export type ProbeRun<TEnv extends O = O, TParams extends O = O> = (
    e: ProbeRunArgs<TEnv, TParams>,
  ) => Promise<void>;

  /** ObjectView configuration subset for structured run result rendering. */
  export type ProbeRunObjectConfig = Pick<t.ObjectViewProps, 'expand' | 'show' | 'sortKeys'>;

  /** Builder API provided to run callbacks for recording execution output. */
  export type ProbeRunArgs<TEnv extends O = O, TParams extends O = O> = TEnv & {
    readonly params: <T = TParams>() => Readonly<T> | undefined;
    obj(input: ProbeRunObjectConfig): ProbeRunArgs<TEnv, TParams>;
    item(item: t.KeyValueItem): ProbeRunArgs<TEnv, TParams>;
    hr(): ProbeRunArgs<TEnv, TParams>;
    title(next: t.ReactNode): ProbeRunArgs<TEnv, TParams>;
    readonly result: (value: unknown) => void;
  };
}
