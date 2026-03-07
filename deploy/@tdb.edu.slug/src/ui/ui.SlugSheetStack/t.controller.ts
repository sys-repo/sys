import type { t } from './common.ts';

/**
 * Controller surface.
 */
export type SlugSheetStackControllerLib = {
  create(initial?: t.SlugSheetStackLayer): t.SlugSheetStackController;
};

export type SlugSheetStackItem = {
  readonly id: t.StringId;
  readonly props: t.SlugSheetProps;
};

export type SlugSheetStackLayer = { readonly sheet: t.SlugSheetController };

/** Controller API for managing sheet stacks. */
export type SlugSheetStackController = t.DisposableLike & {
  readonly length: number;
  readonly stack: t.Signal<readonly SlugSheetStackLayer[]>;
  props(): t.SlugSheetStackProps;
  push(model: t.SlugSheetStackLayer): void;
  pop(count?: number): void;
};
