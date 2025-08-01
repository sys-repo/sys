import React from 'react';
import { type t, css, D } from './common.ts';

export type MaskProps = {
  opacity?: t.Percent;
  height?: t.Pixels;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Mask: React.FC<MaskProps> = (props) => {
  const { opacity = D.maskOpacity, height = D.maskHeight } = props;

  /**
   * Render:
   */
  const gradient = `${pos(0.7, 0)}, ${pos(0.3, 40)}, ${pos(0, 100)}`;
  const backgroundImage = `linear-gradient(to top, ${gradient})`;
  const styles = {
    base: css({
      pointerEvents: 'none',
      backgroundImage,
      opacity,
      height,
    }),
  };

  return <div className={css(styles.base, props.style).class}></div>;
};

/**
 * Helpers:
 */

function pos(percent: t.Percent, position: number) {
  return `rgba(0, 0, 0, ${percent}) ${position}%`;
}
