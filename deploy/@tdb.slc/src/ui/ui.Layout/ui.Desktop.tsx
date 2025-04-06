import React from 'react';
import { type t, AppContent, Button, Cropmarks, css, Signal } from './common.ts';

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
  const theme: t.CommonTheme = 'Dark';
  const styles = {
    base: css({ position: 'relative' }),
    bg: css({ Absolute: 0, display: 'grid' }),
    body: css({ Absolute: 0, display: 'grid' }),
    stack: css({ Absolute: 0, display: 'grid', pointerEvents: 'none' }),
    cropmarks: {
      base: css({ Absolute: 0, display: 'grid', pointerEvents: 'none' }),
      body: css({ width: 390, pointerEvents: 'auto' }),
    },
    dist: css({ Absolute: [null, null, 10, 10], fontSize: 11 }),
  };

  const elCropmarks = (
    <div className={styles.cropmarks.base.class}>
      <Cropmarks
        theme={'Dark'}
        borderOpacity={0.05}
        size={{ mode: 'fill', x: false, y: true, margin: [0, 40, 0, 40] }}
      >
        <div className={styles.cropmarks.body.class}></div>
      </Cropmarks>
    </div>
  );

  const elStackItems = AppContent.Render.stack(state);
  const elStack = <div className={styles.stack.class}>{elStackItems}</div>;

  const dist = p.dist.value;
  const elDist = dist && (
    <Button
      theme={theme}
      style={styles.dist}
      label={() => `version: #${dist.hash.digest.slice(-5)}`}
      onClick={() => window.open('./dist.json', '_blank')}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.bg.class} onClick={onBackgroundClick} />
      <div className={styles.body.class}>
        {elCropmarks}
        {elStack}
      </div>
      {elDist}
    </div>
  );
};
