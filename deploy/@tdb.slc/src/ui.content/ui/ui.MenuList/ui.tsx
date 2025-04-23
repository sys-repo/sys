import React from 'react';
import { type t, Color, css } from './common.ts';
import { MenuButton } from './ui.Button.tsx';

export const MenuList: React.FC<t.MenuListProps> = (props) => {
  const { debug = false, items = [] } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
      alignContent: 'start',
    }),
    body: css({
      backgroundColor: Color.ruby(debug),
    }),
  };

  const button = (item: t.VideoMediaContent) => {
    const label = item.title ?? 'Untitled';
    const onClick = () => props.onSelect?.({ item });
    return <MenuButton key={item.id} label={label} onClick={onClick} />;
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>{items.map((m) => button(m))}</div>
    </div>
  );
};
