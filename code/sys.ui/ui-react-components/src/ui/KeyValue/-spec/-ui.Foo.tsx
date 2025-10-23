import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, D, Rx, Signal } from '../common.ts';

export type FooProps = {
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Foo: React.FC<FooProps> = (props) => {
  /**
   * Render:
   */
  const styles = {
    base: css({
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
      display: 'grid',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>{`🐷 Foo`}</div>
    </div>
  );
};
