import type { t } from './common.ts';

/** Column alignment options */
export type ConceptPlayerAlign = 'Center' | 'Right';

/**
 * <Component>:
 */
export type ConceptPlayerProps = {
  debug?: boolean;
  columnAlign?: ConceptPlayerAlign;
  columnBody?: t.ReactNode;
  columnVideo?: t.VideoPlayerSignals;
  contentTitle?: t.ReactNode;
  contentBody?: t.ReactNode;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onBackClick?: t.MouseEventHandler;
};

/**
 * Defines the player column.
 */
export type ConceptPlayerColumn = Omit<t.CenterColumn, 'width'> & { children?: t.ReactNode };
