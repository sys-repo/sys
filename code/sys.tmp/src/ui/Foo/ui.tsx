import React, { useState } from 'react';
import { count } from './api.Signals.ts';
import { type t, css, pkg, Signal } from './common.ts';

/**
 * Component (UI).
 */
export const Foo: React.FC<t.FooProps> = (props) => {
  const { enabled = true } = props;
  let text = `import → ${pkg.name}@${pkg.version}/ui:<Foo> | ⚡️:signal/count:${count.value}`;

  const [isOver, setOver] = useState(false);
  const over = (isOver: boolean) => () => setOver(isOver);

  const [, setRender] = useState(0);
  const redraw = () => setRender((n) => n + 1);

  /**
   * Lifecycle
   */
  Signal.useSignalEffect(() => {
    count.value;
    redraw();
  });

  /**
   * Render:
   */
  const styles = {
    base: css({
      display: 'inline-block',
      cursor: 'pointer',
      backgroundColor: `rgba(255, 0, 0, ${isOver ? 0.1 : 0.03})` /* RED */,
    }),
    code: css({}),
  };

  if (!enabled) text += ' (disabled)';

  return (
    <div
      className={styles.base.class}
      onMouseEnter={over(true)}
      onMouseLeave={over(false)}
      onClick={() => count.value++}
    >
      <code className={styles.code.class}>🐷 {text}</code>
    </div>
  );
};
