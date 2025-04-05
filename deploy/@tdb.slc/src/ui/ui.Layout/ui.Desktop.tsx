import React from 'react';
import { type t, AppContent, Cropmarks, css, Signal } from './common.ts';

type P = t.LayoutDesktopProps;

/**
 * Component:
 */
export const LayoutDesktop: React.FC<P> = (props) => {
  const { state } = props;
  const p = state?.props;
  if (!p) return null;

  /**
   * Effects:
   */
  Signal.useRedrawEffect(() => {
    state.listen();
  });

  /**
   * Handlers:
   */
  const onBackgroundClick = () => {
    state.stack.pop(1);
  };

  /**
   * Render:
   */
  const styles = {
    base: css({ position: 'relative' }),
    fill: css({ Absolute: 0, display: 'grid' }),
    body: css({ Absolute: 0, display: 'grid', pointerEvents: 'none' }),
    cropmarksBody: css({ width: 390, pointerEvents: 'auto' }),
  };

  const elStack = AppContent.Render.stack(state);

  const elCropmarks = (
    <Cropmarks
      theme={'Dark'}
      borderOpacity={0.05}
      size={{ mode: 'fill', x: false, y: true, margin: [0, 40, 0, 40] }}
    >
      <div className={styles.cropmarksBody.class}></div>
    </Cropmarks>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.fill.class} onClick={onBackgroundClick} />
      <div className={styles.body.class}>
        <div className={styles.fill.class}>{elCropmarks}</div>
        <div className={styles.fill.class}>{elStack}</div>
      </div>
    </div>
  );
};
