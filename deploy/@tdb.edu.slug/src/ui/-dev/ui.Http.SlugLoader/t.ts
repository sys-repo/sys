import type { t } from './common.ts';

export namespace SlugLoaderView {
  export type Lib = {
    readonly Probe: t.FC<t.SlugLoaderView.ProbeProps>;
    readonly Result: t.FC<t.SlugLoaderView.ResultProps>;
  };

  /**
   * Component:
   */
  export type ProbeProps = {
    sample: t.SlugLoaderView.FetchSample;
    is: ProbeRenderArgs['is'];
    origin: t.SlugUrlOrigin;

    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };
  export type ResultProps = {
    spinning?: boolean;
    response?: unknown;
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };

  /**
   * Fetch Samples
   */
  export type FetchSample = {
    readonly title: t.ReactNode;
    readonly render: ProbeRender;
    readonly run?: FetchAction;
  };

  type CommonArgs = {
    readonly is: { readonly local: boolean };
    readonly origin: t.SlugUrlOrigin;
  };

  export type ProbeRender = (e: ProbeRenderArgs) => t.ReactNode | null;
  export type ProbeRenderArgs = CommonArgs & {
    readonly theme?: t.CommonTheme;
    item(item: t.KeyValueItem): ProbeRenderArgs;
  };

  export type FetchAction = (e: FetchActionArgs) => Promise<void>;
  export type FetchActionArgs = CommonArgs & {
    readonly result: (value: unknown) => void;
  };
}
