import React from 'react';
import { type t, Color, Cropmarks, css } from './common.ts';

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
      padding: 15,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Cropmarks theme={theme.name} borderOpacity={0.08}>
        <div className={styles.body.class}>{`🐷 Main`}</div>
      </Cropmarks>
    </div>
  );
};
