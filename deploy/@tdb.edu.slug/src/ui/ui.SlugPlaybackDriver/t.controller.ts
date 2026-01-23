import type { t } from './common.ts';

/**
 * Controller surface.
 */
export type SlugPlaybackControllerLib = {
  create(args?: {
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
export type SlugPlaybackControllerState = {
  readonly tree?: t.TreeHostViewNodeList;
  readonly selectedPath?: t.ObjectPath;
};

export type SlugPlaybackControllerPatch = Partial<SlugPlaybackControllerState>;

export type SlugPlaybackController = t.Lifecycle & {
  readonly id: t.StringId;
  readonly rev: t.NumberMonotonic; // Monotonic change incrementer.
  props(): SlugPlaybackControllerProps;
  state(): SlugPlaybackControllerState;
  next(args?: SlugPlaybackControllerPatch): void;
};
