import React from 'react';
import { type t, Color, Cropmarks, css } from './common.ts';

type P = t.LayoutDesktopProps;

/**
 * Component:
 */
export const LayoutDesktop: React.FC<P> = (props) => {
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
        <div>{`🐷 Layout:Desktop`}</div>
      </Cropmarks>
    </div>
  );
};
