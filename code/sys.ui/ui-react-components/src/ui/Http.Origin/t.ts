import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.origin.ts';

/** HTTP origin environment (e.g. localhost, production). */
export const HTTP_ORIGIN_ENVS = ['localhost', 'production'] as const;
export type HttpOriginEnv = (typeof HTTP_ORIGIN_ENVS)[number];
export type HttpOriginDefaults = Partial<Record<HttpOriginEnv, t.HttpOriginMap>>;

/**
 * HttpOrigin UI Display.
 */
export type HttpOriginLib = {
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
  kind?: t.HttpOriginEnv;
  defaults?: { origin?: t.HttpOriginDefaults };
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
  kind?: t.SignalOptional<t.HttpOriginEnv>;
  origin?: t.SignalOptional<t.HttpOriginMap>;
  defaults?: t.HttpOriginProps['defaults'];
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Controller (State)
 */
type CtrlArgs = {
  props?: Pick<HttpOriginProps, 'kind' | 'defaults'>;
  kind?: t.Signal<t.HttpOriginEnv | undefined>;
  origin?: t.Signal<t.HttpOriginMap | undefined>;
};
export type HttpOriginControllerFactory = (args: CtrlArgs) => HttpOriginController;
export type HttpOriginController = t.Lifecycle & {
  readonly rev: t.NumberMonotonic;
  readonly listen: () => void;
  readonly view: () => Pick<HttpOriginProps, 'kind' | 'defaults' | 'onChange'>;
  readonly state: {
    readonly kind: t.ReadonlySignal<t.HttpOriginEnv | undefined>;
    readonly origin: t.ReadonlySignal<t.HttpOriginMap | undefined>;
  };
};
