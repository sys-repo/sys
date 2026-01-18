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
  visible?: boolean;
  slots?: t.SlugSheetSlots;
  index?: t.Index;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/** Slot registry for SlugSheet. */
export type SlugSheetSlots = {
  main?: t.ReactNode;
};
