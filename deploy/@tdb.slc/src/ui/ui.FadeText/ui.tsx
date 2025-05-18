import React from 'react';
import { type t, Color, css, D, FadeElement, ReactString } from './common.ts';

export const FadeText: React.FC<t.FadeTextProps> = (props) => {
  const {
    text = '',
    fontSize = D.fontSize,
    fontWeight = D.fontWeight,
    letterSpacing = D.letterSpacing,
    lineHeight = D.lineHeight,
    duration = D.duration,
  } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const color = theme.fg;
  const styles = {
    base: css({ position: 'relative', display: 'grid', placeItems: 'center' }),
    item: css({ color, fontSize, fontWeight, letterSpacing, lineHeight }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <FadeElement style={styles.item} duration={duration} children={ReactString.break(text)} />
    </div>
  );
};
