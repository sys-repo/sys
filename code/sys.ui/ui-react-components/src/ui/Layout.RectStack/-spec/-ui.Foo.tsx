import React from 'react';
import { type t, Color, css } from '../common.ts';

export type FooProps = {
  index?: number;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Foo: React.FC<FooProps> = (props) => {
  const { index = 0 } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(0.1),
      color: theme.fg,
      display: 'grid',
      padding: 20,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>{`🐷 index-${index}`}</div>
    </div>
  );
};
