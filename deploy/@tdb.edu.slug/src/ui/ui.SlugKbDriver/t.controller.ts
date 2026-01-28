import type { t } from './common.ts';

/**
 * Factory surface.
 */
export type SlugKbControllerLib = {
  create(props: SlugKbControllerProps): SlugKbController;
};

/**
 * SlugKbController - an EffectController for tree navigation state.
 */
export type SlugKbController = t.EffectController<
  SlugKbState,
  SlugKbPatch,
  SlugKbControllerProps
>;

/** Static config properties of the controller. */
export type SlugKbControllerProps = { baseUrl: t.StringUrl };
export type SlugKbPatch = Partial<SlugKbState>;

/**
 * SlugKbController state.
 */
export type SlugKbState = {
  /** TreeHost view of available slugs. */
  readonly tree?: t.TreeHostViewNodeList;

  /** Currently selected TreeHost path. */
  readonly selectedPath?: t.ObjectPath;

  /** Terminal load error, if any. */
  readonly error?: { readonly message: string };
};
