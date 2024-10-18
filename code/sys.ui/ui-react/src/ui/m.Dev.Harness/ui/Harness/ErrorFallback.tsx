import type { FallbackProps } from 'react-error-boundary';
import { COLORS, css, type t } from '../common.ts';

export type ErrorFallbackProps = FallbackProps & {
  style?: t.CssValue;
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

  const elError = (
    <pre {...styles.pre}>
      <div>{error?.message}</div>
      <div>{error?.stack}</div>
    </pre>
  );

  return (
    <div {...css(styles.base, props.style)}>
      <div {...styles.body}>{elError}</div>
    </div>
  );
};
