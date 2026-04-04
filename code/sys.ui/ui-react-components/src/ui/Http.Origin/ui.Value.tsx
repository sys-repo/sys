import React from 'react';
import { type t, A, Color, css, Str } from './common.ts';

export type ValueProps = {
  url: t.StringUrl;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Value: React.FC<ValueProps> = (props) => {
  const { debug = false } = props;
  const label = Str.trimHttpScheme(props.url);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
      minWidth: 0,
    }),
    anchor: css({
      color: 'inherit',
      display: 'block',
      minWidth: 0,
      textAlign: 'right',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <A href={props.url} style={styles.anchor}>
        {label}
      </A>
    </div>
  );
};
