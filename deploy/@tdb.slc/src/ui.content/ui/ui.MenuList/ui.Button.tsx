import React, { useState } from 'react';
import { type t, Button, Color, css, Icons } from './common.ts';

export type MenuButtonProps = {
  label: t.ReactNode;
  selected?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onClick?: t.ReactMouseEventHandler;
};

/**
 * Component:
 */
export const MenuButton: React.FC<MenuButtonProps> = (props) => {
  const { label = 'Untitled', selected = false } = props;
  const [isOver, setOver] = useState(false);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const color = wrangle.color(theme, selected, isOver);

  const styles = {
    base: css({
      color,
      display: 'grid',
      borderBottom: `solid 1px ${Color.alpha(theme.fg, 0.1)}`,
      ':last-child': { borderBottom: 'none' },
    }),
    body: css({
      Padding: [15, 0],
      display: 'grid',
      gridTemplateColumns: ' 1fr auto',
      alignItems: 'center',
      columnGap: '10px',
    }),
    button: {
      label: css({ color }),
    },
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Button onMouse={(e) => setOver(e.isOver)} onClick={props.onClick}>
        <div className={styles.body.class}>
          <div className={styles.button.label.class}>{label}</div>
          <Icons.Chevron.Right size={26} color={color} />
        </div>
      </Button>
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  color(theme: t.ColorTheme, isSelected: boolean, isOver: boolean) {
    //
    let color = isOver ? Color.BLUE : theme.fg;
    if (isSelected) color = Color.BLUE;
    return color;
  },
} as const;
