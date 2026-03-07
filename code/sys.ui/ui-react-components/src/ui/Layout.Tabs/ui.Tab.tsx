import React from 'react';
import { type t, Color, css, usePointer } from './common.ts';

export type TabProps = {
  item: t.Tabs.Item;
  selected?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  tabStyle?: t.Tabs.TabStyle;
  onClick?: t.Tabs.ChangeHandler;
};

/**
 * Component:
 */
export const Tab: React.FC<TabProps> = (props) => {
  const { item, selected = false } = props;
  const id = item.id;
  const tabStyle = props.tabStyle;

  const pointer = usePointer({
    capture: false,
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
  const idleOpacity = tabStyle?.idleOpacity ?? 0.2;
  const selectedColor = tabStyle?.selectedColor ?? theme.fg;
  const hoverColor = tabStyle?.hoverColor ?? Color.BLUE;
  const color = selected
    ? selectedColor
    : pointer.is.over
      ? hoverColor
      : Color.alpha(theme.fg, idleOpacity);

  const styles = {
    base: css({
      display: 'grid',
      placeItems: 'center',
      minWidth: 0,
      fontSize: tabStyle?.fontSize ?? 14,
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
