import React from 'react';
import { type t, AppContent, Cropmarks, css } from './common.ts';

type P = t.LayoutDesktopProps;

/**
 * Component:
 */
export const LayoutDesktop: React.FC<P> = (props) => {
  const { state } = props;
  const p = state?.props;
  if (!p) return null;

  /**
   * Render:
   */
  const styles = {
    base: css({ display: 'grid' }),
    body: css({ width: 390 }),
  };

  const elStack = AppContent.Render.stack(state);

  return (
    <div className={css(styles.base, props.style).class}>
      <Cropmarks
        theme={'Dark'}
        borderOpacity={0.05}
        size={{ mode: 'fill', x: false, y: true, margin: [40, 40, 0, 40] }}
      >
        <div className={styles.body.class}>{elStack}</div>
      </Cropmarks>
    </div>
  );
};
