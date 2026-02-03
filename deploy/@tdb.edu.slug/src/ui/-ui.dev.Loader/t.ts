import type { t } from './common.ts';

export type DevLoaderOriginKind = 'localhost' | 'production';

/**
 * Loader debug/selection UI.
 */
export type DevLoaderLib = {
  readonly UI: t.FC<DevLoaderProps>;
  readonly controller: t.DevLoaderControllerFactory;
};

/**
 * Component:
 */
export type DevLoaderProps = {
  origin?: t.DevLoaderOriginKind;
  default?: { origin?: { local?: t.SlugLoaderOrigin; prod?: t.SlugLoaderOrigin } };

  //
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onOriginChange?: (e: { next: t.DevLoaderOriginKind }) => void;
};

/**
 * State controller
 */
export type DevLoaderControllerFactory = (
  args: DevLoaderControllerFactoryArgs,
) => DevLoaderController;
export type DevLoaderControllerFactoryArgs = {
  origin?: t.Signal<t.DevLoaderOriginKind | undefined>;
  props?: Pick<DevLoaderProps, 'origin' | 'default'>;
};

export type DevLoaderController = {
  readonly rev: t.NumberMonotonic;
  readonly props: Pick<DevLoaderProps, 'origin' | 'default' | 'onOriginChange'>;
  readonly origin: t.SlugLoaderOrigin;
  readonly listen: () => void;
};
