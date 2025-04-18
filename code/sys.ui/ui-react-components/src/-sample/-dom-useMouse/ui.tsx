import { useClickInside, useClickOutside, useMouse } from '@sys/ui-react';
import React from 'react';

import { type t, css } from '../-test.ui.ts';
import { type DebugSignals } from './-SPEC.Debug.tsx';

export type SampleProps = {
  debug: DebugSignals;
  style?: t.CssInput;
};

export const Sample: React.FC<SampleProps> = (props) => {
  const { debug } = props;

  const ref = React.useRef<HTMLDivElement>(null);
  useClickInside({ ref, callback: (e) => console.info(`⚡️ click-inside:`, e) });
  useClickOutside({ ref, callback: (e) => console.info(`⚡️ click-outside:`, e) });

  const mouse = useMouse();
  console.info('mouse.is', mouse.is);

  /**
   * Render:
   */
  const styles = {
    base: css({
      position: 'relative',
      overflow: 'hidden',
      userSelect: 'none',
      padding: 20,
    }),
  };

  return (
    <div ref={ref} className={css(styles.base, props.style).class}>
      <div {...mouse.handlers}>{'🐷 Hello'}</div>
    </div>
  );
};
