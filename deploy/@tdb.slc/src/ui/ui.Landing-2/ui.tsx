import React from 'react';
import { type t, Color, css } from './common.ts';

import { CanvasMini } from '../ui.Canvas.Mini/mod.ts';
import { Logo } from '../ui.Logo/mod.ts';

export const Landing: React.FC<t.Landing2Props> = (props) => {
  const { debug = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      overflow: 'hidden',
      display: 'grid',
      placeItems: 'center',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <CanvasMini theme={theme.name} />
      <Logo theme={theme.name} />
    </div>
  );
};
