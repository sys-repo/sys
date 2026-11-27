import React from 'react';
import { Color, css, type t } from './common.ts';

export type FooProps = { style?: t.Style.Input };

/**
 * Component:
 */
export const Foo: React.FC<FooProps> = (props) => {
  /**
   * Render:
   */
  const styles = {
    base: css({ backgroundColor: Color.ruby(0.1), display: 'grid' }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>{`🐷 Foo`}</div>
    </div>
  );
};
