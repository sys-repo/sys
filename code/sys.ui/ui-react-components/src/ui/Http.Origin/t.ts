import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.data.ts';

export declare namespace HttpOrigin {
  /**
   * HttpOrigin UI Display.
   */
  export type Lib = {
    readonly Data: t.HttpOriginDataLib;
    readonly controller: ControllerFactory;
    readonly UI: {
      readonly Uncontrolled: t.FC<Props>;
      readonly Controlled: t.FC<ControlledProps>;
    };
  };

  /** HTTP origin environment (e.g. localhost, production). */
  export type Env = 'localhost' | 'production';
  export type VerifyStatus = 'idle' | 'running' | 'ok' | 'error';
  export type Verify = boolean | VerifyOptions;
  export type VerifyOptions = { resolveUrl?: (e: VerifyResolveArgs) => t.StringUrl };
  export type VerifyResolveArgs = { origin: t.StringUrl; key: string; env: Env };

  /**
   * Component
   */
  export type Props = {
    env?: Env;
    spec?: t.HttpOriginSpecMap<Env>;
    verify?: Verify;
    //
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
    onChange?: (e: { next: Env }) => void;
  };

  /**
   * Controlled Component
   */
  export type ControlledProps = {
    env?: t.SignalOptional<Env>;
    origin?: t.SignalOptional<t.UrlTree>;
    spec?: t.HttpOriginSpecMap<Env>;
    verify?: Verify;
    debug?: boolean;
    theme?: t.CommonTheme;
    style?: t.CssInput;
  };

  /**
   * Controller (State)
   */
  export type ControllerArgs = {
    props?: Pick<Props, 'env' | 'spec'>;
    env?: t.Signal<Env | undefined>;
    origin?: t.Signal<t.UrlTree | undefined>;
  };
  /** Factory signature for constructing a Http.Origin state controller. */
  export type ControllerFactory = (args: ControllerArgs) => Controller;
  /** Controller contract exposing lifecycle hooks and derived view state. */
  export type Controller = t.Lifecycle & {
    readonly rev: t.NumberMonotonic;
    readonly listen: () => void;
    readonly view: () => Pick<Props, 'env' | 'spec' | 'onChange'>;
    readonly state: {
      readonly env: t.ReadonlySignal<Env | undefined>;
      readonly origin: t.ReadonlySignal<t.UrlTree | undefined>;
    };
  };
}
