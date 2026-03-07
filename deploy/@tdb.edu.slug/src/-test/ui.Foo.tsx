import React from 'react';
import { type t, Color, css } from './common.ts';

export type FooProps = {
  label?: t.ReactNode;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  padding?: t.CssEdgesInput;
};

/**
 * Component:
 */
export const Foo: React.FC<FooProps> = (props) => {
  const { debug = true, label = '🐷 Foo' } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      display: 'grid',
      minHeight: 60,
      Padding: props.padding ?? 4,
    }),
    body: css({
      backgroundColor: Color.ruby(debug),
      border: `dashed 1px ${Color.alpha(theme.fg, debug ? 0.2 : 0)}`,
      borderRadius: 6,
      display: 'grid',
      placeItems: 'center',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>{label}</div>
    </div>
  );
};
