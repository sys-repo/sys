import type { t } from './common.ts';
import type { DriverInfoProps } from './-dev/ui.DriverInfo.tsx';

/** Type re-exports. */
export type * from './t.controller.ts';

/**
 * SlugKbDriver
 *
 * Minimal slug-tree navigation driver for the KB slug-tree manifest.
 */
export type SlugKbDriverLib = {
  readonly Dev: SlugKbDriverDevLib;
  readonly Controller: t.SlugKbControllerLib;
};

/**
 * Dev helpers for the SlugKbDriver.
 */
export type SlugKbDriverDevLib = {
  readonly DriverInfo: t.FC<DriverInfoProps>;
};
