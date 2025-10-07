import React from 'react';
import { type t, css, D, M } from './common.ts';

/**
 * SlideDeck — renders current panel; if the key changes,
 * also renders the previous panel and slides both simultaneously.
 */
export function SlideDeck(props: {
  children: React.ReactNode;
  keyId: string;
  direction: -1 | 0 | 1;
  duration?: t.Msecs;
  offset?: t.Pixels;
  style?: t.CssInput;
}) {
  const { keyId, direction: dir, children } = props;

  /**
   * Refs/Hooks:
   */
  const prevKeyRef = React.useRef(keyId);
  const prevContentRef = React.useRef<React.ReactNode>(children);
  const [leaving, setLeaving] = React.useState<React.ReactNode | null>(null);

  /**
   * Effect:
   *  - Detect key change
   *  - Capture previous content for one transition frame.
   */
  React.useEffect(() => {
    if (prevKeyRef.current !== keyId) {
      setLeaving(prevContentRef.current);
      prevKeyRef.current = keyId;
    }
    prevContentRef.current = children;
  }, [keyId, children]);

  const ms = props.duration ?? D.slideDuration;
  const offset = props.offset ?? D.slideOffset;
  const enterX = dir === 1 ? offset : dir === -1 ? -offset : 0;
  const exitX = dir === 1 ? -offset : dir === -1 ? offset : 0;
  const transition = { duration: ms / 1000, ease: 'easeInOut' as const };

  /**
   * Render:
   */
  const styles = {
    base: css({ display: 'grid', overflow: 'hidden' }),
    panel: css({ gridArea: '1 / 1' }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      {/* Leaving panel (slides out): */}
      {leaving && (
        <M.div
          className={styles.panel.class}
          initial={{ opacity: 1, x: 0 }}
          animate={{ opacity: 0, x: exitX }}
          transition={transition}
          onAnimationComplete={() => setLeaving(null)}
        >
          {leaving}
        </M.div>
      )}

      {/* Entering panel (slides in): */}
      <M.div
        key={keyId}
        className={styles.panel.class}
        initial={{ opacity: 0, x: enterX }}
        animate={{ opacity: 1, x: 0 }}
        transition={transition}
      >
        {children}
      </M.div>
    </div>
  );
}
