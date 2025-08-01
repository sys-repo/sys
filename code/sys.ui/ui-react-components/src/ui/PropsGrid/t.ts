import type { t } from './common.ts';

/**
 * <Component>:
 */
export type PropsGridProps = {
  debug?: boolean;
  data?: PropsGridRows;

  // Appearance:
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Grid data:
 */
export type PropsGridRows = PropsGridRow[];
export type PropsGridRow = PropsGridCell[];
export type PropsGridCell = number | string | PropsGridCellDef;
export type PropsGridCellDef = { value?: boolean | number | string | React.JSX.Element };
