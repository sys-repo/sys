import React from 'react';
import { type t, Is, Color, css } from './common.ts';
import { MenuButton } from './ui.Button.tsx';

type P = t.MenuListProps;

export const MenuList: React.FC<P> = (props) => {
  const { debug = false } = props;
  const selected = wrangle.selected(props);
  const items = wrangle.items(props);

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
    body: css({}),
  };

  const button = (item: t.MenuListItem, index: t.Index) => {
    const label = item.label ?? 'Untitled';
    const onClick = () => props.onSelect?.({ item, index });
    return (
      <MenuButton
        key={item.id ?? index}
        label={label}
        selected={selected.includes(index)}
        onClick={onClick}
      />
    );
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>{items.map((v, i) => button(v, i))}</div>
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  selected(props: P): t.Index[] {
    const { selected = [] } = props;
    return Array.isArray(selected) ? selected : [selected];
  },

  items(props: P): t.MenuListItem[] {
    if (props.items == null) return [];
    const items = props.items.filter((m) => !Is.nil(m));
    return items.map((m) => (typeof m === 'string' ? { label: m } : m));
  },
} as const;
