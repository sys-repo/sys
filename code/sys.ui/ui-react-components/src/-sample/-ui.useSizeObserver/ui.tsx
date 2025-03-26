import React from 'react';
import { type t, css, useSizeObserver } from '../-test.ui.ts';
import { type DebugSignals } from './-SPEC.Debug.tsx';

export type SampleProps = {
  debug: DebugSignals;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Sample: React.FC<SampleProps> = (props) => {
  const { debug } = props;

  const size = useSizeObserver((e) => (debug.rect.value = e.rect));

  /**
   * Render:
   */
  const styles = {
    base: css({ position: 'relative', overflow: 'hidden' }),
    body: css({ boxSizing: 'border-box', margin: 20 }),
    pre: css({ marginLeft: 20, fontSize: 14, fontWeight: 500 }),
  };
  return (
    <div ref={size.ref} className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <div>{'👋 useSizeObserver:'}</div>
        <pre className={styles.pre.class}>{JSON.stringify(size.rect, null, '  ')}</pre>
      </div>
    </div>
  );
};
