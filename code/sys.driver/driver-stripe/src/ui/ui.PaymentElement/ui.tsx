import React from 'react';
import { type t, Color, css, D } from './common.ts';
import { usePaymentElement } from './use.PaymentElement.ts';

export const PaymentElement: t.FC<t.PaymentElement.Props> = (props) => {
  const mountRef = React.useRef<HTMLDivElement>(null);
  const state = usePaymentElement({ mountRef, props });

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(0),
      color: theme.fg,
      padding: 10,
    }),
  };

  const missing = !state.configured;
  const message = state.error
    ? state.error.message
    : missing
      ? 'Stripe Payment Element not configured (missing publishableKey/clientSecret).'
      : undefined;

  return (
    <div className={css(styles.base, props.style).class} data-component={D.displayName}>
      {message && <div className={css(styles.note, state.error && styles.error).class}>{message}</div>}
      <div ref={mountRef} className={styles.mount.class} />
    </div>
  );
};
