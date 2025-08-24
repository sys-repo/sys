import React from 'react';

import { type t, Color, css, D, useFactory } from './common.ts';
import { Error } from './ui.Error.tsx';

/**
 * Component:
 */
export const SampleReact: React.FC<t.SampleReactProps> = (props) => {
  const { debug = false, strategy = D.strategy, factory, plan } = props;

  /**
   * Hook: Resolve the plan → React element.
   */
  const { element, loading, error } = useFactory(factory, plan, {
    strategy,
    key: debug ? 'debug' : undefined,
  });

  if (!factory || !plan) return null;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ backgroundColor: Color.ruby(debug), color: theme.fg, display: 'grid' }),
    loading: css({ userSelect: 'none', display: 'grid', placeItems: 'center' }),
  };

  console.group(`🌳 factory: Adapter.React:Sample`);
  console.info('loading:', loading);
  if (element) console.info('element:', element);
  if (error) console.info('error:', error);
  console.groupEnd();

  return (
    <div className={css(styles.base, props.style).class}>
      {loading && <div className={styles.loading.class}>{'Loading...'}</div>}
      {error && <Error message={error.message} theme={theme.name} />}

      {/* When successfully loaded: */}
      {!loading && !error && element}
    </div>
  );
};
