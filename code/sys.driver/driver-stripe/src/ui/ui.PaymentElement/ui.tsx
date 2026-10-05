import React from 'react';
import { type t, Color, css, D } from './common.ts';
import { Message } from './ui.Message.tsx';
import { usePaymentElement } from './use.PaymentElement.ts';

export const PaymentElement: t.FC<t.PaymentElement.Props> = (props) => {
  const mountRef = React.useRef<HTMLDivElement>(null);
  const state = usePaymentElement({ mountRef, props });

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    root: css({
      position: 'relative',
      color: theme.fg,
      minHeight: 64,
      display: 'grid',
      gap: 8,
    }),
    mountHost: css({ display: 'grid', minHeight: 44 }),
  };

  const missing = !state.configured;
  const message = state.error
    ? state.error.message
    : missing
      ? 'Stripe PaymentElement waiting for runtime payment session.'
      : undefined;

  const elMessage = message && (
    <Message
      //
      theme={props.theme}
      kind={state.error ? 'error' : 'info'}
      message={message}
    />
  );

  return (
    <div className={css(styles.root, props.style).class} data-component={D.displayName}>
      {elMessage}
      <div ref={mountRef} className={styles.mountHost.class} />
    </div>
  );
};
