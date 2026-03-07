import type { t } from './common.ts';

/**
 * Controller surface.
 */
export type SlugSheetControllerLib = {
  create(args?: { props?: () => t.SlugSheetControllerProps }): t.SlugSheetController;
};

/** Controller inputs: slots. */
export type SlugSheetControllerProps = {
  slots?: t.SlugSheetSlots;
};

/** SlugSheet runtime controller surface. */
export type SlugSheetController = t.Lifecycle & {
  readonly id: t.StringId;
  props(): t.SlugSheetControllerProps;
};
