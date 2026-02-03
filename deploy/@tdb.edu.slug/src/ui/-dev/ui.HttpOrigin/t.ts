import type { t } from './common.ts';

export type DevOriginKind = 'localhost' | 'production';
export type DevOriginDefaults = { local?: t.SlugLoaderOrigin; prod?: t.SlugLoaderOrigin };

/**
 * Loader debug/selection UI.
 */
export type HttpOriginLib = {
  readonly controller: t.DevOriginControllerFactory;
  readonly UI: {
    readonly Uncontrolled: t.FC<t.DevOriginProps>;
    readonly Controlled: t.FC<t.DevOriginControlledProps>;
  };
};

/**
 * Component
 */
export type DevOriginProps = {
  kind?: t.DevOriginKind;
  defaults?: { origin?: t.DevOriginDefaults };
  //
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onChange?: (e: { next: t.DevOriginKind }) => void;
};

/**
 * Controlled Component
 */
export type DevOriginControlledProps = {
  kind?: t.Signal<t.DevOriginKind | undefined>;
  origin?: t.Signal<t.SlugLoaderOrigin | undefined>;
  defaults?: t.DevOriginProps['defaults'];
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Controller (State)
 */
type CtrlArgs = {
  props?: Pick<DevOriginProps, 'kind' | 'defaults'>;
  kind?: t.Signal<t.DevOriginKind | undefined>;
  origin?: t.Signal<t.SlugLoaderOrigin | undefined>;
};
export type DevOriginControllerFactory = (args: CtrlArgs) => DevOriginController;
export type DevOriginController = t.Lifecycle & {
  readonly rev: t.NumberMonotonic;
  readonly view: () => Pick<DevOriginProps, 'kind' | 'defaults' | 'onChange'>;
  readonly state: {
    readonly kind: t.ReadonlySignal<t.DevOriginKind | undefined>;
    readonly origin: t.ReadonlySignal<t.SlugLoaderOrigin | undefined>;
  };
  readonly listen: () => void;
};
