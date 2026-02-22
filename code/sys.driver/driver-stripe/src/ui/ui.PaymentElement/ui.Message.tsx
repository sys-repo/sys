import React from 'react';
import { type t, Color, css } from './common.ts';

export type MessageProps = {
  message: string;
  kind?: 'info' | 'error';
  theme?: t.CommonTheme;
  style?: t.CssInput;
};

/**
 * Host-only diagnostic message chrome (Stripe UI visuals are rendered by Elements).
 */
export const Message: React.FC<MessageProps> = (props) => {
  const isError = props.kind === 'error';

  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      Absolute: 0,
      display: 'grid',
      placeItems: 'center',
    }),
    body: css({
      fontSize: 13,
      color: Color.alpha(theme.fg, 0.4),
      lineHeight: 1.4,
      textAlign: 'center',
    }),
    error: css({
      color: Color.RED,
      backgroundColor: Color.alpha(Color.RED, 0.08),
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={css(styles.body, isError && styles.error).class}>{props.message}</div>
    </div>
  );
};
