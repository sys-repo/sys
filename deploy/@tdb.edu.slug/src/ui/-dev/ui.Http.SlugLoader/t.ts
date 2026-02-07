import type { t } from './common.ts';

export namespace SlugLoaderView {
  type ParamsObject = Record<string, unknown>;

  export type Lib = {
    readonly Probe: t.FC<t.SlugLoaderView.ProbeProps>;
    readonly Result: t.FC<t.SlugLoaderView.ResultProps>;
  };

  /**
   * Component:
   */
  export type ProbeProps<TParams extends ParamsObject = ParamsObject> = {
    sample: t.SlugLoaderView.ProbeSpec<TParams>;
    is: ProbeRenderArgs<TParams>['is'];
    origin: t.SlugUrlOrigin;
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
  export type ProbeSpec<TParams extends ParamsObject = ParamsObject> = {
    readonly title: t.ReactNode;
    readonly render: ProbeRender<TParams>;
    readonly run?: ProbeRun<TParams>;
  };

  type CommonArgs = {
    readonly is: { readonly local: boolean };
    readonly origin: t.SlugUrlOrigin;
  };

  export type ProbeRender<TParams extends ParamsObject = ParamsObject> = (
    e: ProbeRenderArgs<TParams>,
  ) => t.ReactNode | null;
  export type ProbeRenderArgs<TParams extends ParamsObject = ParamsObject> = CommonArgs & {
    readonly theme?: t.CommonTheme;
    readonly params: (value: TParams) => ProbeRenderArgs<TParams>;
    item(item: t.KeyValueItem): ProbeRenderArgs<TParams>;
  };

  export type ProbeRun<TParams extends ParamsObject = ParamsObject> = (
    e: ProbeRunArgs<TParams>,
  ) => Promise<void>;
  export type ProbeRunArgs<TParams extends ParamsObject = ParamsObject> = CommonArgs & {
    readonly params: <T = TParams>() => Readonly<T> | undefined;
    item(item: t.KeyValueItem): ProbeRunArgs<TParams>;
    readonly result: (value: unknown) => void;
  };
}
