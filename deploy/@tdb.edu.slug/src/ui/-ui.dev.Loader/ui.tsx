import React from 'react';
import { type t, Color, css } from './common.ts';
import { Origin } from './ui.Origin.tsx';

type P = t.DevLoaderProps;

export const ClientLoader: React.FC<P> = (props) => {
  const { debug = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      fontSize: 12,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Origin {...props} />
    </div>
  );
};
