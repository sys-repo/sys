import React from 'react';
import { type t, Color, css, D } from './common.ts';
import { Item } from './ui.Item.tsx';

export const Playlist: React.FC<t.PlaylistProps> = (props) => {
  const { items = [], debug = false, gap = D.gap, paddingTop } = props;
  if (items.length === 0) return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      backgroundColor: Color.alpha(Color.RUBY, debug ? 0.08 : 0),
      color: theme.fg,
      fontSize: 16,
      userSelect: 'none',
    }),
    body: css({
      position: 'relative',
      display: 'grid',
      paddingTop,
    }),
    list: css({
      display: 'grid',
      alignContent: 'start',
      rowGap: gap,
    }),
    line: css({
      Absolute: [0, null, 12, D.bulletSize / 2 - 0.5],
      backgroundColor: Color.alpha(theme.fg, 0.12),
      width: 1,
    }),
  };

  const row = (media: t.VideoMediaContent) => {
    return <Item key={media.id} media={media} theme={theme.name} />;
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <div className={styles.line.class} />
        <div className={styles.list.class}>{items.map((media) => row(media))}</div>
      </div>
    </div>
  );
};
