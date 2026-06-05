import React from 'react';
import { type FallbackProps, getErrorMessage } from 'react-error-boundary';
import { COLORS, css, type t } from '../common.ts';

export type ErrorFallbackProps = FallbackProps & {
  style?: t.CssInput;
};

export const ErrorFallback: React.FC<ErrorFallbackProps> = (props) => {
  const { error, resetErrorBoundary } = props;

  /**
   * [Render]
   */
  const styles = {
    base: css({ display: 'grid', placeItems: 'center' }),
    body: css({
      position: 'relative',
      minWidth: 400,
      MarginX: 50,
      padding: 30,
      backgroundColor: COLORS.MAGENTA,
      color: COLORS.WHITE,
      borderRadius: 10,
      overflow: 'hidden',
    }),
    pre: css({ fontSize: 12 }),
  };

  const message = getErrorMessage(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const elError = (
    <pre className={styles.pre.class}>
      <div>{message}</div>
      <div>{stack}</div>
    </pre>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>{elError}</div>
    </div>
  );
};
