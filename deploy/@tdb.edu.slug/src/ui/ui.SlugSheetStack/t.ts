import type { t } from './common.ts';

/** Type re-exports */
export type * from './t.controller.ts';

/** SlugSheetStack runtime library surface. */
export type SlugSheetStackLib = {
  readonly UI: t.FC<SlugSheetStackProps>;
  readonly Controller: t.SlugSheetStackControllerLib;
};

/**
 * Component:
 */
export type SlugSheetStackProps = {
  items: t.Ary<t.SlugSheetStackItem>;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onPop(): void;
};
