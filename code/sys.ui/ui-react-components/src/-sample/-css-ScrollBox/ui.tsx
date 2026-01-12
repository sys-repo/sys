import React from 'react';
import { type t, Color, css, Str } from './common.ts';

export const ScrollBoxSample: React.FC<t.ScrollBoxSampleProps> = (props) => {
  const { debug = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      padding: 10,
      width: 360,
    }),
  };

  const text = Str.Lorem.words(1000);

  return <div className={css(styles.base, props.style).class}>{text}</div>;
};
