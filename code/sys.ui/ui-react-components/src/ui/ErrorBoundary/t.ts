import type { ErrorBoundaryPropsWithFallback, FallbackProps } from 'react-error-boundary';
import type { t } from './common.ts';

type Base = Pick<ErrorBoundaryPropsWithFallback, 'resetKeys' | 'onError' | 'onReset'>;

/**
 * Error boundary component props.
 */
export type ErrorBoundaryProps = Base & {
  children?: t.ReactNode;
  fallbackRender?: ErrorBoundaryRenderer;
  theme?: t.CommonTheme;
};

/**
 * Renders a fallback UI when an error occurs.
 */
export type ErrorBoundaryRenderer = (props: ErrorBoundaryFallbackProps) => t.ReactNode;

/**
 * Props passed to the fallback renderer.
 */
export type ErrorBoundaryFallbackProps = FallbackProps & {
  theme?: t.CommonTheme;
};
