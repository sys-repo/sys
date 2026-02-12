import React from 'react';
import { type t, Color, css, D, usePointer } from './common.ts';

export type TabProps = {
  item: t.Tabs.Item;
  selected?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onClick?: t.Tabs.ChangeHandler;
};

/**
 * Component:
 */
export const Tab: React.FC<TabProps> = (props) => {
  const { item, selected = false } = props;
  const id = item.id;

  /**
   * Hooks:
   */
  const pointer = usePointer({
    onUp(e) {
      if (selected) return;
      if (e.type !== 'pointerup' && e.type !== 'touchend') return;
      props.onClick?.({ id });
    },
  });

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const color = selected ? Color.WHITE : pointer.is.over ? Color.BLUE : Color.alpha(theme.fg, 0.2);

  const styles = {
    base: css({
      height: D.Tabstrip.height,
      display: 'grid',
      placeItems: 'center',
      minWidth: 0,
      fontSize: 14,
      userSelect: 'none',
      cursor: selected ? 'default' : 'pointer',
      color,
      transform: `translateY(${!selected && pointer.is.down ? 1 : 0}px)`,
    }),
    body: css({
      display: 'grid',
      placeItems: 'center',
      minWidth: 0,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class} {...pointer.handlers}>
      <div className={styles.body.class}>{item.label ?? item.id}</div>
    </div>
  );
};
