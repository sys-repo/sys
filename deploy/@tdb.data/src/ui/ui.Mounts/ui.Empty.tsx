import React from 'react';
import { type t, Color, css } from './common.ts';

export type EmptyProps = {
  error?: string;
  debug?: boolean;
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Empty: React.FC<EmptyProps> = (props) => {
  const { debug = false, error } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: Color.alpha(theme.fg, 0.6),
      fontSize: 12,
      display: 'grid',
      lineHeight: 1.6,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div>{error ?? 'No mounts found.'}</div>
    </div>
  );
};
