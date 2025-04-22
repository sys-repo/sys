import React, { useEffect, useState } from 'react';
import { type t, css } from './common.ts';

export type ItemProps = {
  children: React.ReactNode;
  duration: t.Msecs;
  show: boolean;
  style?: t.CssInput;
};

export const Item: React.FC<ItemProps> = (props) => {
  const { children, duration, show, style } = props;
  const [visible, setVisible] = useState(() => !show);

  /**
   * Effect: manage fade-in/out.
   */
  useEffect(() => {
    // Reset to opposite state immediately.
    setVisible(!show);

    let rafA: number;
    let rafB: number;

    // Next frame → schedule another frame → flip to `show`.
    rafA = requestAnimationFrame(() => {
      rafB = requestAnimationFrame(() => setVisible(show));
    });

    return () => {
      cancelAnimationFrame(rafA);
      cancelAnimationFrame(rafB);
    };
  }, [show]);

  /**
   * Render:
   */
  const styles = {
    base: css({ display: 'grid', placeItems: 'center' }),
    body: css({
      transition: `opacity ${duration}ms`,
      opacity: visible ? 1 : 0,
    }),
  };

  return (
    <div className={css(styles.base, style).class}>
      <div className={styles.body.class}>{children}</div>
    </div>
  );
};
