import React from 'react';
import { type t, Color, css } from '../common.ts';

export type FooProps = {
  index?: number;
  selected?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onClick?: () => void;
};

/**
 * Component:
 */
export const Foo: React.FC<FooProps> = (props) => {
  const { index = 0, selected = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(selected ? 0.4 : 0.1),
      color: theme.fg,
      display: 'grid',
      padding: 20,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class} onPointerDown={props.onClick}>
      <div>{`🐷 index-${index}`}</div>
    </div>
  );
};
