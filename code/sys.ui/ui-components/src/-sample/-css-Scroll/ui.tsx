import React from 'react';
import { type t, Color, css, Str } from './common.ts';

/**
 * Component
 */
export type ScrollSampleProps = {
  debug?: boolean;
  Scroll?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

export const ScrollSample: React.FC<ScrollSampleProps> = (props) => {
  const { debug = false, Scroll = true } = props;
  const text = Str.Lorem.words(1000);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      width: 360,
    }),
    body: css({ Scroll, Absolute: 0, padding: 10, paddingBottom: 20 }),
  };

  return (
    <div className={styles.base.class}>
      <div className={css(styles.body, props.style).class}>{text}</div>
    </div>
  );
};
