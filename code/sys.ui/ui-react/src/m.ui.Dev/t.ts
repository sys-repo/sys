import type { t } from './common.ts';
import type { DevHarnessProps } from './ui.tsx';

/**
 * A "development harness" UI <Component>.
 */
export type DevHarness = t.FC<DevHarnessProps>;

/**
 * Library: tools for building UI.
 */
export type DevLib = {
  /* DevHarness */
  DevHarness: DevHarness;
};
