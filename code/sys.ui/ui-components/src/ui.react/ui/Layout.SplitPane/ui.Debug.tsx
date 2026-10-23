import React from 'react';
import { type t, Color, css } from './common.ts';

export type DebugProps = {
  index: t.Index;
  ratios: t.Percent[];
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Debug: React.FC<DebugProps> = (props) => {
  const { ratios, index } = props;
  const i = index;
  const text = `${Math.round(ratios[i] * 100)}% • ${Math.round(ratios[i + 1] * 100)}%`;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      fontSize: 11,
      opacity: 0.6,
      whiteSpace: 'nowrap',
      pointerEvents: 'none',
      userSelect: 'none',
    }),
  };

  return <div className={css(styles.base, props.style).class}>{text}</div>;
};
