import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.data.ts';

/** HTTP origin environment (e.g. localhost, production). */
export const HTTP_ORIGIN_ENVS = ['localhost', 'production'] as const;
export type HttpOriginEnv = (typeof HTTP_ORIGIN_ENVS)[number];

/**
 * HttpOrigin UI Display.
 */
export type HttpOriginLib = {
  readonly Data: t.HttpOriginDataLib;
  readonly controller: t.HttpOriginControllerFactory;
  readonly UI: {
    readonly Uncontrolled: t.FC<t.HttpOriginProps>;
    readonly Controlled: t.FC<t.HttpOriginControlledProps>;
  };
};

/**
 * Component
 */
export type HttpOriginProps = {
  env?: t.HttpOriginEnv;
  spec?: t.HttpOriginSpecMap<t.HttpOriginEnv>;
  //
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onChange?: (e: { next: t.HttpOriginEnv }) => void;
};

/**
 * Controlled Component
 */
export type HttpOriginControlledProps = {
  env?: t.SignalOptional<t.HttpOriginEnv>;
  origin?: t.SignalOptional<t.UrlTree>;
  spec?: t.HttpOriginSpecMap<t.HttpOriginEnv>;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Controller (State)
 */
type CtrlArgs = {
  props?: Pick<HttpOriginProps, 'env' | 'spec'>;
  env?: t.Signal<t.HttpOriginEnv | undefined>;
  origin?: t.Signal<t.UrlTree | undefined>;
};
export type HttpOriginControllerFactory = (args: CtrlArgs) => HttpOriginController;
export type HttpOriginController = t.Lifecycle & {
  readonly rev: t.NumberMonotonic;
  readonly listen: () => void;
  readonly view: () => Pick<HttpOriginProps, 'env' | 'spec' | 'onChange'>;
  readonly state: {
    readonly env: t.ReadonlySignal<t.HttpOriginEnv | undefined>;
    readonly origin: t.ReadonlySignal<t.UrlTree | undefined>;
  };
};
