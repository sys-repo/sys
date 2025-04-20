import type { t } from './common.ts';

/**
 * <Component>:
 */
export type ConceptPlayerProps = {
  debug?: boolean;
  column?: t.ConceptPlayerColumn;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Properties for the main/center content column.
 */
export type ConceptPlayerColumn = {
  children?: t.ReactNode;
  align?: 'Left' | 'Center' | 'Right';
  marginTop?: t.Pixels;
  gap?: t.Pixels;
  width?: t.Pixels;
};
