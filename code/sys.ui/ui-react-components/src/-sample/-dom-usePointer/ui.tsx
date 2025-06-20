import { useClickInside, useClickOutside, usePointer } from '@sys/ui-react';
import React from 'react';

import { type t, css, Obj } from '../-test.ui.ts';
import { type DebugSignals } from './-SPEC.Debug.tsx';

export type SampleProps = {
  debug: DebugSignals;
  style?: t.CssInput;
};

export const Sample: React.FC<SampleProps> = (props) => {
  const { debug } = props;
  const p = debug.props;

  /**
   * Hooks:
   */
  const ref = React.useRef<HTMLDivElement>(null);
  useClickInside({ ref, callback: (e) => console.info(`⚡️ inside:`, e) });
  useClickOutside({ ref, callback: (e) => console.info(`⚡️ outside:`, e) });

  const pointer = usePointer({
    onDown: (e) => {},
    onUp: (e) => {},
    onDrag: (e) => (p.dragArgs.value = e),
  });

  /**
   * Effects:
   */
  React.useEffect(() => void (p.pointerIs.value = pointer.is), [Obj.hash(pointer.is)]);

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
      <div {...pointer.handlers}>{'🐷 Hello'}</div>
    </div>
  );
};
