import React from 'react';
import { type t, Color, Cropmarks, css } from './common.ts';

type P = t.LayoutIntermediateProps;

/**
 * Component:
 */
export const LayoutIntermediate: React.FC<P> = (props) => {
  const { state } = props;
  const p = state?.props;
  if (!p) return null;

  /**
   * Render:
   */
  const styles = {
    base: css({ display: 'grid' }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Cropmarks theme={'Dark'} borderOpacity={0.05}>
        <div>{`🐷 Layout:Intermediate`}</div>
      </Cropmarks>
    </div>
  );
};
