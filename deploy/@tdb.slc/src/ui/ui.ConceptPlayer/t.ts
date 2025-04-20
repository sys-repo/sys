import type { t } from './common.ts';

/**
 * <Component>:
 */
export type ConceptPlayerProps = {
  debug?: boolean;
  controlColumn?: t.ConceptPlayerControlColumn;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Properties for the main "control column" of the player.
 */
export type ConceptPlayerControlColumn = {
  children?: t.ReactNode;
  align?: 'Left' | 'Center' | 'Right';
  marginTop?: t.Pixels;
};
