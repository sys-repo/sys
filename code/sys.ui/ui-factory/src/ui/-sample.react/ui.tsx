import React from 'react';

import { type t, Color, css, D, useFactory, ValidationErrors } from './common.ts';
import { RuntimeError } from './ui.Error.Runtime.tsx';
import { Loading } from './ui.Loading.tsx';

/**
 * Component:
 */
export const SampleReact: React.FC<t.SampleReactProps> = (props) => {
  const { debug = false, strategy = D.strategy, validate, factory, plan, debugDelay } = props;

  /**
   * Hook: Resolve the plan → React element (+issues).
   */
  const { element, loading, issues } = useFactory(factory, plan, {
    key: debug ? 'debug' : undefined,
    strategy,
    validate,
    debug: { delay: debugDelay },
  });

  if (!factory || !plan) return null;
  const hasValidationErrors = issues.validation.length > 0;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg, display: 'grid' }),
    loading: css({ Absolute: 0 }),
    validation: css({ Absolute: 0 }),
    element: css({
      display: 'grid',
      opacity: hasValidationErrors ? 0.15 : 1,
      filter: `blur(${hasValidationErrors ? 10 : 0}px)`,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      {loading && <Loading theme={theme.name} style={styles.loading} />}

      {/* Runtime error (rendered prominently): */}
      {issues.runtime && <RuntimeError message={issues.runtime.message} theme={theme.name} />}

      {/* Validation issues: */}
      {hasValidationErrors && (
        <ValidationErrors
          //
          title={'Runtime Validation Error'}
          errors={issues.validation}
          style={styles.validation}
          theme={theme.name}
        />
      )}

      {/* When successfully loaded: */}
      {!loading && !issues.runtime && <div className={styles.element.class}>{element}</div>}
    </div>
  );
};
