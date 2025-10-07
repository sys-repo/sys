import React from 'react';
import { type t, Color, css, Is } from './common.ts';
import { Wrangle } from './u.ts';

export type ThumbProps = {
  enabled: boolean;
  pressed?: boolean;
  percent: t.Percent;
  totalWidth: t.Pixels;
  thumb: t.SliderThumbProps;
  height: t.Pixels;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

export const Thumb: React.FC<ThumbProps> = (props) => {
  const { enabled, thumb, percent, totalWidth } = props;
  const left = Wrangle.thumbLeft(percent, totalWidth, thumb.size);
  const pressed = enabled && props.pressed;

  /**
   * Render
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      Absolute: [null, null, null, left],
      width: thumb.size,
      height: props.height,
      pointerEvents: 'none',
      transform: `scale(${pressed ? thumb.pressedScale : 1})`,
      opacity: thumb.opacity,
      display: 'grid',
      placeItems: 'center',
    }),
    body: css({
      Size: thumb.size,
      overflow: 'hidden',
      borderRadius: thumb.size / 2,
      backgroundColor: Is.string(thumb.color) ? thumb.color : Color.alpha(Color.WHITE, thumb.color),
      border: `solid 1px ${Color.alpha(Color.DARK, thumb.border)}`,
      boxSizing: 'border-box',
      boxShadow: `0 1px 5px 0 ${Color.format(-0.1)}`,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class} />
    </div>
  );
};
