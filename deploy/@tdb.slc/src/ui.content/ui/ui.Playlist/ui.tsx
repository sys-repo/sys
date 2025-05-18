import React from 'react';
import { type t, Color, css, D } from './common.ts';
import { Item } from './ui.Item.tsx';

export const Playlist: React.FC<t.PlaylistProps> = (props) => {
  const { debug = false, items = [], filled, gap = D.gap, paddingTop } = props;
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
    body: css({ position: 'relative', display: 'grid', paddingTop }),
    list: css({ display: 'grid', alignContent: 'start' }),
    line: css({
      Absolute: [0, null, 18, D.bulletSize / 2 - 0.5],
      backgroundColor: Color.alpha(theme.fg, 0.12),
      width: 1,
    }),
    item: css({ MarginY: gap / 2 }),
    hr: css({ marginLeft: 20 }),
  };

  const row = (item: t.PlaylistItem | undefined, index: number) => {
    if (!item) return null;

    const media = item;
    const isSelected = index === props.selected;
    const isFilled = filled ? filled.includes(index) : false;
    return (
      <Item
        key={media.id}
        index={index}
        media={media}
        selected={isSelected}
        filled={isFilled}
        theme={theme.name}
        style={styles.item}
        onClick={props.onChildSelect}
      />
    );
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <div className={styles.line.class} />
        <div className={styles.list.class}>{items.map((item, i) => row(item, i))}</div>
      </div>
    </div>
  );
};
