import React from 'react';
import { type t, Color, css } from './common.ts';
import { Stream } from './ui.Stream.tsx';

type P = t.VideoRecorderViewProps;

/**
 * Component:
 */
export const Main: React.FC<P> = (props) => {
  const { debug = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid' }),
    body: css({
      width: 400,
      height: 220,
      display: 'grid',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <Stream {...props} />
      </div>
    </div>
  );
};
