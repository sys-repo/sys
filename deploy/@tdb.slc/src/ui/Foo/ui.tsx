import React from 'react';
import { type t, Color, css, pkg } from './common.ts';

export const Foo: React.FC<t.FooProps> = (props) => {
  const {} = props;

  /**
   * Render
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
      color: theme.fg,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>{`🐷 ${pkg.name}:Foo`}</div>
    </div>
  );
};
