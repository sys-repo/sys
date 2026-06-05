import React from 'react';
import { type t, Color, css, D } from './common.ts';

type P = t.BulletProps;

export const Bullet: React.FC<P> = (props) => {
  const { colorTransition = 0 } = props;
  const Size = props.size ?? D.size;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const backgroundColor = wrangle.backgroundColor(props, theme);
  const styles = {
    base: css({
      Size,
      position: 'relative',
      borderRadius: '50%',
      backgroundColor: theme.bg,
      display: 'grid',
    }),
    body: css({
      borderRadius: '50%',
      border: `solid 1px ${Color.alpha(theme.fg, 0.16)}`,
      backgroundColor,
      transition: colorTransition ? `background-color ${colorTransition}ms ease` : undefined,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}></div>
    </div>
  );
};

/**
 * Helpers:
 */
const wrangle = {
  backgroundColor(props: P, theme: t.ColorTheme) {
    const { selected = D.selected, filled = D.filled } = props;
    if (selected) return props.selectedColor ?? Color.BLUE;
    if (filled) return props.filledColor ?? Color.alpha(theme.fg, 0.16);
    return theme.bg;
  },
} as const;
