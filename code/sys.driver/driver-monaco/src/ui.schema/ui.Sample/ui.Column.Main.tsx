import React from 'react';
import { type t, Color, Cropmarks, css } from './common.ts';

type P = t.SampleProps;

/**
 * Component:
 */
export const MainColumn: React.FC<P> = (props) => {
  const {} = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      display: 'grid',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Cropmarks theme={theme.name}>
        <div>{`🐷 MainColumn`}</div>
      </Cropmarks>
    </div>
  );
};
