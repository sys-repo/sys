import React from 'react';
import { type t, Color, css } from './common.ts';

export type PlaylistProps = {
  items?: t.VideoMediaContent[];
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Playlist: React.FC<PlaylistProps> = (props) => {
  const { items = [] } = props;
  if (items.length === 0) return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      lineHeight: 2.5,
      userSelect: 'none',
      display: 'grid',
    }),
    list: css({}),
  };

  const row = (media: t.VideoMediaContent) => {
    const label = media.title ?? 'Untitled';
    return <div key={media.id}>{label}</div>;
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.list.class}>{items.map((media) => row(media))}</div>
    </div>
  );
};
