import React from 'react';
import { type t, Color, css } from './common.ts';

export type FooProps = {
  label?: string;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Foo: React.FC<FooProps> = (props) => {
  const { debug = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      position: 'relative',
      color: theme.fg,
      display: 'grid',
      minHeight: 60,
      padding: 4,
    }),
    body: css({
      backgroundColor: Color.ruby(true),
      border: `dashed 1px ${Color.alpha(theme.fg, 0.2)}`,
      borderRadius: 6,
      display: 'grid',
      placeItems: 'center',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>{props.label ?? `🐷 Foo`}</div>
    </div>
  );
};
