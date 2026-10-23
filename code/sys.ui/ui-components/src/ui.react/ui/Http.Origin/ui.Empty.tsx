import React from 'react';
import { type t, Color, css } from './common.ts';

export type EmptyProps = {
  label?: t.ReactNode;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Empty: React.FC<EmptyProps> = (props) => {
  const { debug = false, label = 'No origin-urls to display' } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: Color.alpha(theme.fg, 0.3),
      padding: 10,
      display: 'grid',
      placeItems: 'center',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>{label}</div>
    </div>
  );
};
