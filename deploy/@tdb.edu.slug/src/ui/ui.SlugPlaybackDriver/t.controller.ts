import type { t } from './common.ts';

/** Type re-exports. */
export type * from './t.controller.ts';

/**
 * Controller surface.
 */
export type SlugPlaybackControllerLib = {
};

/** Controller inputs: slots. */
export type SlugPlaybackControllerProps = {
  slots?: t.TreeHostSlots;
};

/** SlugPlayback runtime controller surface. */
export type SlugPlaybackController = t.Lifecycle & {
  readonly id: t.StringId;
  props(): SlugPlaybackControllerProps;
};
