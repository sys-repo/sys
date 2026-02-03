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
  default?: { origin?: { local?: t.SlugLoaderOrigin; prod?: t.SlugLoaderOrigin } };
  //
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onChange?: (e: { next: t.DevOriginKind }) => void;
};

/**
 * State controller
 */
type CtrlArgs = {
  kind?: t.Signal<t.DevOriginKind | undefined>;
  props?: Pick<DevOriginProps, 'kind' | 'default'>;
};
export type DevOriginControllerFactory = (args: CtrlArgs) => DevOriginController;
export type DevOriginController = {
  readonly rev: t.NumberMonotonic;
  readonly props: Pick<DevOriginProps, 'kind' | 'default' | 'onChange'>;
  readonly origin: t.ReadonlySignal<t.SlugLoaderOrigin>;
  readonly listen: () => void;
};
