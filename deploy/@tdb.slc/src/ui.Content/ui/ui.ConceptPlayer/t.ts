import type { t } from './common.ts';

/** Column alignment options */
export type ConceptPlayerAlign = 'Center' | 'Right';

/**
 * <Component>:
 */
export type ConceptPlayerProps = {
  debug?: boolean;
  columnAlign?: ConceptPlayerAlign;
  columnWidth?: t.Pixels;
  columnBody?: t.ReactNode;
  columnVideo?: t.VideoPlayerSignals;
  contentTitle?: t.ReactNode;
  contentBody?: t.ReactNode;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onBackClick?: t.MouseEventHandler;
};
