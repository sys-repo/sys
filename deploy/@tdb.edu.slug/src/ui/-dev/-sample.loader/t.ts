import type { t } from './common.ts';

export namespace SlugLoaderView {
  export type Lib = {
    readonly Result: t.FC<t.SlugLoaderView.ResultProps>;
  };

  /**
   * Component:
   */
  export type ProbeProps = {
    sample: t.SlugLoaderView.FetchSample;
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
    readonly probe: FetchSampleRender;
  };

  export type FetchSampleRender = (e: FetchSampleRenderArgs) => t.ReactNode | void;
  export type FetchSampleRenderArgs = {
    readonly is: { readonly local: boolean };
    readonly theme: t.CommonTheme;
    readonly origin: t.SlugUrlOrigin;
    readonly next: (patch: Partial<FetchSampleState>) => void;
  };

  export type FetchSampleState = {};
}
