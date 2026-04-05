import type { t } from './common.ts';

/** Visual selector for SLC data HTTP origins. */
export declare namespace HttpOrigin {
  export type Lib = {
    readonly UI: {
      readonly Uncontrolled: t.FC<Props>;
      readonly Controlled: t.FC<ControlledProps>;
    };
    readonly Default: { readonly spec: SpecMap };
  };

  export type SpecMap = t.HttpOriginBase.SpecMap<t.HttpOriginBase.Env>;
  export type Props = Omit<t.HttpOriginBase.Props, 'spec'> & { spec?: SpecMap };
  export type ControlledProps = Omit<t.HttpOriginBase.ControlledProps, 'spec'> & {
    spec?: SpecMap;
  };
}
