import React from 'react';
import { ErrorBoundary as BaseErrorBoundary } from 'react-error-boundary';

import { type t } from './common.ts';
import { ErrorBoundaryFallback } from './ui.Fallback.tsx';

const defaultFallback: t.ErrorBoundaryRenderer = (props) => <ErrorBoundaryFallback {...props} />;

/**
 * Error boundary component.
 */
export const ErrorBoundary: React.FC<t.ErrorBoundaryProps> = (props) => {
  const { fallbackRender = defaultFallback, theme } = props;
  return (
    <BaseErrorBoundary
      fallbackRender={(e) => fallbackRender({ ...e, theme })}
      resetKeys={props.resetKeys}
      onError={props.onError}
      onReset={props.onReset}
    >
      {props.children}
    </BaseErrorBoundary>
  );
};
