import type { t } from './common.ts';

/**
 * <Component>:
 */
export type PlaylistProps = {
  debug?: boolean;
  items?: (t.PlaylistItem | undefined)[];
  selected?: t.Index;
  filled?: t.Index[];

  // Appearance:
  paddingTop?: t.Pixels;
  gap?: t.Pixels;
  theme?: t.CommonTheme;
  style?: t.CssInput;

  // Events:
  onChildSelect?: (e: { item: t.VideoMediaContent; index: t.Index }) => void;
};

/**
 * Item within a playlist.
 */
export type PlaylistItem = t.VideoMediaContent | '---';
