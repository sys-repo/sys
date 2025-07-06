import { useClickInside, useClickOutside, usePointer } from '@sys/ui-react';
import React from 'react';

import { type t, Color, css, Obj } from '../-test.ui.ts';
import { type DebugSignals } from './-SPEC.Debug.tsx';

export type SampleProps = {
  debug: DebugSignals;
  style?: t.CssInput;
};

export const Sample: React.FC<SampleProps> = (props) => {
  const { debug } = props;
  const p = debug.props;

  const dragdrop = p.dragdrop.value;

  console.log('dragdrop', dragdrop);

  /**
   * Hooks:
   */
  const ref = React.useRef<HTMLDivElement>(null);
  useClickInside({ ref, callback: (e) => console.info(`⚡️ inside:`, e) });
  useClickOutside({ ref, callback: (e) => console.info(`⚡️ outside:`, e) });

  const pointer = usePointer({
    onEnter: (e) => {},
    onLeave: (e) => {},
    onDown: (e) => {},
    onUp: (e) => {},
    onDrag(e) {
      p.drag.value = e;
    },
    onDragdrop(e) {
      p.dragdrop.value = e.action === 'Drag' ? e : undefined;
    },
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
      backgroundColor: pointer.is.dragdropping ? Color.ruby() : undefined,
    }),
    label: css({
      transform: `translateY(${pointer.is.down ? 2 : 0}px)`,
    }),
  };

  return (
    <div ref={ref} className={css(styles.base, props.style).class} {...pointer.handlers}>
      <div className={styles.label.class}>{'🐷 Hello'}</div>
    </div>
  );
};
