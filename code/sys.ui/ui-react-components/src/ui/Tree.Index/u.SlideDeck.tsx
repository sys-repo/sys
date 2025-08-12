import React from 'react';
import { type t, css, M } from './common.ts';

/**
 * SlideDeck — renders current panel; if the key changes,
 * also renders the previous panel and slides both simultaneously.
 */
export function SlideDeck(props: {
  keyId: string;
  dir: -1 | 0 | 1;
  children: React.ReactNode;
  style?: t.CssInput;
}) {
  const { keyId, dir, children } = props;

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

  const enterX = dir === 1 ? 24 : dir === -1 ? -24 : 0;
  const exitX = dir === 1 ? -24 : dir === -1 ? 24 : 0;

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
          transition={{ type: 'spring', stiffness: 260, damping: 26, mass: 0.6 }}
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
        transition={{ type: 'spring', stiffness: 260, damping: 26, mass: 0.6 }}
      >
        {children}
      </M.div>
    </div>
  );
}
