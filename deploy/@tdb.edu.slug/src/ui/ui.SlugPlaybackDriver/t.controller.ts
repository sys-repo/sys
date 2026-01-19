import type { t } from './common.ts';

/**
 * Controller surface.
 */
export type SlugPlaybackControllerLib = {
  create(args?: { props?: () => SlugPlaybackControllerProps }): SlugPlaybackController;
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
