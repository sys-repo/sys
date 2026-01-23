import type { t } from './common.ts';

/**
 * Controller surface.
 */
export type SlugPlaybackControllerLib = {
  create(args: {
    baseUrl?: t.StringUrl;
    props?: () => SlugPlaybackControllerProps;
  }): SlugPlaybackController;
};

/** Controller inputs: slots. */
export type SlugPlaybackControllerProps = {
  slots?: t.TreeHostSlots;
};

/**
 * SlugPlayback runtime controller surface.
 */
export type SlugPlaybackController = t.Lifecycle & {
  readonly id: t.StringId;
  readonly rev: t.NumberMonotonic; // Monotonic change
  props(): SlugPlaybackControllerProps;
  next(args: SlugPlaybackControllerNext): void;
};

export type SlugPlaybackControllerNext = {
  tree?: t.TreeHostViewNodeList;
  selectedPath?: t.ObjectPath;
};
