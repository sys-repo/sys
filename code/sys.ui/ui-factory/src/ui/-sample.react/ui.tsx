import React from 'react';
import { type t, Color, css, D, useFactory, ValidationErrors } from './common.ts';
import { RuntimeError } from './ui.Error.Runtime.tsx';

/**
 * Component:
 */
export const SampleReact: React.FC<t.SampleReactProps> = (props) => {
  const { debug = false, strategy = D.strategy, validate, factory, plan } = props;

  /**
   * Hook: Resolve the plan → React element (+issues).
   */
  const { ok, element, loading, issues } = useFactory(factory, plan, {
    key: debug ? 'debug' : undefined,
    strategy,
    validate,
  });

  if (!factory || !plan) return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', color: theme.fg, display: 'grid' }),
    loading: css({ userSelect: 'none', display: 'grid', placeItems: 'center' }),
    validation: css({ Absolute: 0 }),
  };

  /**
   * Debug output:
   */
  console.group(`🌳 factory: Adapter.React:Sample`);
  console.info('loading:', loading);
  console.info('ok:', ok);
  if (element) console.info('element:', element);
  if (issues.runtime) console.info('runtime error:', issues.runtime);
  if (issues.validation?.length) console.info('validation:', issues.validation);
  console.groupEnd();

  return (
    <div className={css(styles.base, props.style).class}>
      {loading && <div className={styles.loading.class}>{'Loading...'}</div>}

      {/* Runtime error (rendered prominently) */}
      {issues.runtime && <RuntimeError message={issues.runtime.message} theme={theme.name} />}

      {/* Validation issues: */}
      {!!issues.validation.length && (
        <ValidationErrors
          //
          backbgroundBlur={12}
          title={'Runtime Validation Error'}
          errors={issues.validation}
          style={styles.validation}
          theme={theme.name}
        />
      )}

      {/* When successfully loaded: */}
      {!loading && !issues.runtime && element}
    </div>
  );
};
