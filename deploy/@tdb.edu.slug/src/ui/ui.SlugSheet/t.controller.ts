import type { t } from './common.ts';

/**
 * Controller surface.
 */
export type SlugSheetControllerLib = {
  create(args: t.SlugSheetControllerProps): t.SlugSheetController;
};

/** Controller inputs: slots. */
export type SlugSheetControllerProps = {
  slots?: t.SlugSheetSlots;
};

/** SlugSheet runtime controller surface. */
export type SlugSheetController = t.DisposableLike & {
  props(): t.SlugSheetProps;
};
