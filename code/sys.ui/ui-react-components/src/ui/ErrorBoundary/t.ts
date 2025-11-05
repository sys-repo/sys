import { type FallbackProps, ErrorBoundary as BaseErrorBoundary } from 'react-error-boundary';
import type { t } from './common.ts';

/**
 * Error boundary component props.
 */
export type ErrorBoundaryProps = {
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
  debug?: boolean;
  theme?: t.CommonTheme;
};
