import React from 'react';
import { type t, css } from '../-test.ui.ts';
import { type DebugSignals } from './-SPEC.Debug.tsx';

import { useMouse } from '@sys/ui-react';

export type SampleProps = {
  debug: DebugSignals;
  style?: t.CssInput;
};

export const Sample: React.FC<SampleProps> = (props) => {
  const { debug } = props;

  const mouse = useMouse();
  console.info('mouse.is', mouse.is);

  /**
   * Render:
   */
  const styles = {
    base: css({
      position: 'relative',
      overflow: 'hidden',
      padding: 20,
      userSelect: 'none',
    }),
  };

  return (
    <div className={css(styles.base, props.style).class} {...mouse.handlers}>
      <div>{'🐷 Hello'}</div>
    </div>
  );
};
