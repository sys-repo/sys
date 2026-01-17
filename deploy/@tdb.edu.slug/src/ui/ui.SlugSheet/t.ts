import type { t } from './common.ts';

/** Type re-exports */
export type * from './t.controller.ts';

/**
 * SlugSheet
 * Atomic sheet render primitive.
 */
export type SlugSheetLib = {
  readonly UI: t.FC<t.SlugSheetProps>;
  readonly Controller: t.SlugSheetControllerLib;
};

/**
 * Component:
 */
export type SlugSheetProps = {
  slots?: t.SlugSheetSlots;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/** Slot registry for SlugSheet. */
export type SlugSheetSlots = {
  tree?: t.ReactNode;
  main?: t.ReactNode;
  aux?: t.ReactNode;
};
