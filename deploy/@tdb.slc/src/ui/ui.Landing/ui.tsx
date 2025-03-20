import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, Signal, DEFAULTS, rx } from './common.ts';
import { useKeyboard } from './use.Keyboard.ts';
import { VideoBackground } from './ui.Video.Background.tsx';
import { Layout } from './ui.Layout.tsx';
import { CanvasMini } from '../ui.Canvas.Mini/mod.ts';
import { useSelectedPanel } from './use.SelectedPanel.ts';

type P = t.LandingProps;

/**
 * Component:
 */
export const Landing: React.FC<P> = (props) => {
  const { signals } = props;
  const p = signals?.props;

  useKeyboard();
  const selectedPanel = useSelectedPanel();

  /**
   * Effects
   */
  Signal.useRedrawEffect(() => {
    if (!p) return;
    p.ready.value;
    p.canvasPosition.value;
  });

  /**
   * Render.
   */
  const theme = Color.theme(props.theme ?? 'Dark');
  const styles = {
    base: css({
      color: theme.fg,
      backgroundColor: theme.bg,
      fontFamily: 'sans-serif',
    }),
    fill: css({ Absolute: 0 }),
  };

  const elLayout = (
    <Layout
      style={styles.fill}
      theme={theme.name}
      canvas={{
        element: <CanvasMini theme={theme.name} selected={selectedPanel} />,
        position: signals?.props.canvasPosition.value,
      }}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <VideoBackground style={styles.fill} />
      {elLayout}
    </div>
  );
};
