import React from 'react';
import { type t, Color, css, Spinners } from './common.ts';

export const Loading: React.FC<t.LoadingProps> = (props) => {
  const { debug = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      userSelect: 'none',
      display: 'grid',
      placeItems: 'center',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Spinners.Bar theme={theme.name} />
    </div>
  );
};
