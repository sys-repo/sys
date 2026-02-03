import type { t } from './common.ts';

export type DevOriginKind = 'localhost' | 'production';

/**
 * Loader debug/selection UI.
 */
export type DevOriginLib = {
  readonly UI: t.FC<DevOriginProps>;
  readonly controller: t.DevOriginControllerFactory;
};

/**
 * Component:
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

export type DevOriginDefaults = { local?: t.SlugLoaderOrigin; prod?: t.SlugLoaderOrigin };

/**
 * State controller
 */
type CtrlArgs = {
  props?: Pick<DevOriginProps, 'kind' | 'defaults'>;
  kind?: t.Signal<t.DevOriginKind | undefined>;
  origin?: t.Signal<t.SlugLoaderOrigin | undefined>;
};
export type DevOriginControllerFactory = (args: CtrlArgs) => DevOriginController;
export type DevOriginController = {
  readonly rev: t.NumberMonotonic;
  readonly props: Pick<DevOriginProps, 'kind' | 'defaults' | 'onChange'>;
  readonly kind: t.ReadonlySignal<t.DevOriginKind | undefined>;
  readonly origin: t.ReadonlySignal<t.SlugLoaderOrigin | undefined>;
  readonly listen: () => void;
};
