import type { t } from './common.ts';

/** Visual selector for SLC data HTTP origins. */
export declare namespace HttpOrigin {
  export type Lib = {
    readonly UI: t.FC<Props>;
    readonly Default: { readonly spec: SpecMap };
  };

  export type SpecMap = t.HttpOriginSpecMap<t.HttpOriginBase.Env>;

  export type Props = {
    env?: t.SignalOptional<t.HttpOriginBase.Env>;
    origin?: t.SignalOptional<t.UrlTree>;
    spec?: SpecMap;
    verify?: t.HttpOriginBase.Verify;
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };
}
