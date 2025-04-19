import React from 'react';
import { type t, Color, css } from './common.ts';

export type FadeMaskProps = {
  direction: t.VideoPlayerMaskFadeDirection;
  size?: t.Pixels;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

type P = FadeMaskProps;

/**
 * Component:
 */
export const FadeMask: React.FC<P> = (props) => {
  const mask = wrangle.mask(props);

  /**
   * Render:
   */
  const styles = {
    base: css({
      pointerEvents: 'none',
      ...mask.style,
    }),
  };
  return <div className={css(styles.base, props.style).class}></div>;
};

/**
 * Helpers
 */
const wrangle = {
  mask(props: P) {
    const { direction, size = 30 } = props;
    const theme = Color.theme(props.theme);
    const is = {
      vertical: direction === 'Top:Down' || direction === 'Bottom:Up',
      horizontal: direction === 'Left:Right' || direction === 'Right:Left',
    };

    let Absolute: t.CssEdgesInput;
    if (direction === 'Top:Down') Absolute = [0, 0, null, 0];
    if (direction === 'Bottom:Up') Absolute = [null, 0, 0, 0];
    if (direction === 'Left:Right') Absolute = [0, null, 0, 0];
    if (direction === 'Right:Left') Absolute = [0, 0, 0, null];

    const style = {
      Absolute,
      width: is.horizontal ? size : undefined,
      height: is.vertical ? size : undefined,
      backgroundImage: wrangle.cssFade(direction, theme.bg),
    };

    return { is, style } as const;
  },

  cssFade(direction: t.VideoPlayerMaskFadeDirection, color: string) {
    const deg = {
      'Top:Down': 'to bottom',
      'Bottom:Up': 'to top',
      'Left:Right': 'to right',
      'Right:Left': 'to left',
    }[direction];
    return `linear-gradient(${deg}, ${color} 0%, transparent 100%)`;
  },
} as const;
