import type { t } from './common.ts';

/**
 * <Component>:
 */
export type ConceptPlayerProps = {
  debug?: boolean;
  columnAlign?: 'Center' | 'Right';
  columnBody?: t.ReactNode;
  contentTitle?: t.ReactNode;
  contentBody?: t.ReactNode;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onBackClick?: t.MouseEventHandler;
};

/**
 * Defines the player column.
 */
export type ConceptPlayerColumn = Omit<t.HGridColumn, 'width'> & { children?: t.ReactNode };
