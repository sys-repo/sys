import type { t } from './common.ts';

/**
 * Preload rendering helpers.
 */
export type PreloadLib = {
  render: Preload;
  Portal: React.FC<PreloadPortalProps>;
};

/**
 * <Component>:
 * A portal container used for pre-loading component content off screen.
 */
export type PreloadPortalProps = {
  children: React.ReactNode;
  size?: t.SizeTuple;
  name?: string;
};

/**
 * Preload function that performs all DOM insertion and clean up.
 */
export type Preload = (
  children: React.ReactNode,
  options?: t.PreloadOptions | t.Msecs,
) => Promise<t.Lifecycle>;

/** Options for the preload function. */
export type PreloadOptions = {
  lifetime?: t.Msecs;
  size?: t.SizeTuple;
  name?: string;
};
