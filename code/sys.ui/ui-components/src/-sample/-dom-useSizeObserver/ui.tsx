import React from 'react';
import { css, type t, useSizeObserver } from '../-test.ui.ts';
import { Dev } from '../common.ts';
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
  const size = useSizeObserver((e) => (debug.rect.value = e.toObject()));

  /**
   * Render:
   */
  const styles = {
    base: css({ position: 'relative', overflow: 'hidden' }),
    body: css({ boxSizing: 'border-box', margin: 20 }),
  };

  return (
    <div ref={size.ref} className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <div>{`👋 useSizeObserver: ${size.toString()}`}</div>
        <Dev.ObjectView name={'size.rect'} data={size.toObject()} block margin={[10, 20]} />
      </div>
    </div>
  );
};
