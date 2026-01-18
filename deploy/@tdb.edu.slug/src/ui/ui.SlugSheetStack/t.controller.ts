import type { t } from './common.ts';

/**
 * Controller surface.
 */
export type SlugSheetStackControllerLib = {
  create(initial?: t.SlugSheetStackSheet): t.SlugSheetStackController;
};

export type SlugSheetStackItem = {
  readonly id: t.StringId;
  readonly props: t.SlugSheetProps;
};

export type SlugSheetStackSheet = {
  readonly id: t.StringId;
  readonly sheet: t.SlugSheetController;
};

/** Controller API for managing sheet stacks. */
export type SlugSheetStackController = t.DisposableLike & {
  readonly stack: t.Signal<readonly SlugSheetStackSheet[]>;
  props(): t.SlugSheetStackProps;
  push(model: SlugSheetStackSheet): void;
  pop(count?: number): void;
};
