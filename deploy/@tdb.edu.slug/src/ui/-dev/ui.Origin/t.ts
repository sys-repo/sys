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
  origin?: t.DevOriginKind;
  default?: { origin?: { local?: t.SlugLoaderOrigin; prod?: t.SlugLoaderOrigin } };

  //
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onOriginChange?: (e: { next: t.DevOriginKind }) => void;
};

/**
 * State controller
 */
type CtrlArgs = {
  origin?: t.Signal<t.DevOriginKind | undefined>;
  props?: Pick<DevOriginProps, 'origin' | 'default'>;
};
export type DevOriginControllerFactory = (args: CtrlArgs) => DevOriginController;
export type DevOriginController = {
  readonly rev: t.NumberMonotonic;
  readonly props: Pick<DevOriginProps, 'origin' | 'default' | 'onOriginChange'>;
  readonly origin: t.SlugLoaderOrigin;
  readonly listen: () => void;
};
