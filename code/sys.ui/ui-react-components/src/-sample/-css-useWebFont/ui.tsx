import React from 'react';
import { type t, Color, css } from './common.ts';

/**
 * Component:
 */
export type SampleFontProps = {
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

export const SampleFont: React.FC<SampleFontProps> = (props) => {
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
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>{`🐷 sample webfont`}</div>
    </div>
  );
};
