import React, { useRef } from 'react';
import { Player, VimeoBackground } from '../common.ts';
import { LogoCanvas } from '../ui.Logo.Canvas/mod.ts';

import { type t, Color, css, DEFAULTS, LogoWordmark, Signal } from './common.ts';
import { Layout } from './ui.Layout.tsx';
import { Sidebar } from './ui.Sidebar.tsx';
import { useKeyboard } from './use.Keyboard.ts';
import { useSelectedPanel } from './use.SelectedPanel.ts';

type P = t.Landing1Props;
const D = DEFAULTS;

const signalsFactory = () =>
  Player.Video.signals({
    // src: 'vimeo/727951677', // Rowan: "group scale",
    src: 'vimeo/1068502644', // Trailer
  });

/**
 * Component:
 */
export const Landing: React.FC<P> = (props) => {
  const { signals } = props;
  const p = signals?.props;
  const canvasPosition = p?.canvasPosition.value ?? D.canvasPosition;
  const sidebarVisible = p?.sidebarVisible.value ?? D.sidebarVisible;

  /**
   * Hooks:
   */
  useKeyboard();
  const selectedPanel = useSelectedPanel();
  const playerSignalsRef = useRef(signalsFactory());
  const player = playerSignalsRef.current;

  /**
   * Effects:
   */
  Signal.useRedrawEffect(() => {
    if (!p) return;
    p.ready.value;
    p.canvasPosition.value;
    selectedPanel.value;
  });

  Signal.useEffect(() => {
    const canvasPosition = p?.canvasPosition.value ?? DEFAULTS.canvasPosition;
    if (!player) return;
    if (canvasPosition === 'Center:Bottom') {
      player.play();
    } else {
      player.pause();
    }
  });

  /**
   * Render.
   */
  const sidebarRightWidth = sidebarVisible ? 360 : 0;
  const theme = Color.theme(props.theme ?? 'Dark');
  const speed = 100;

  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      backgroundColor: theme.bg,
      fontFamily: 'sans-serif',
    }),

    fill: css({ Absolute: 0 }),
    logo: css({
      Absolute: [null, 15, 12, null],
      width: 110,
    }),

    body: css({ Absolute: 0, display: 'grid' }),
    layout: css({
      Absolute: [0, sidebarRightWidth, 0, 0],
      transition: `right ${speed}ms ease-in-out`,
    }),
    sidebar: {
      right: css({
        Absolute: [0, 0, 0, null],
        width: sidebarRightWidth,
        transition: `width ${speed}ms ease-in-out`,
      }),
    },
  };

  const elLayout = (
    <Layout
      style={styles.layout}
      theme={theme.name}
      canvas={{
        element: <LogoCanvas theme={theme.name} selected={selectedPanel.value} />,
        position: p?.canvasPosition.value,
      }}
      video={{
        element: <Player.Video.View signals={playerSignalsRef.current} />,
      }}
    />
  );

  const elSidebarRight = (
    <Sidebar style={styles.sidebar.right} theme={props.theme} width={sidebarRightWidth} />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <LogoWordmark style={styles.logo} theme={theme.name} />

      <VimeoBackground
        video={499921561} // Tubes.
        opacity={canvasPosition === 'Center' ? 0.3 : 0.15}
        theme={theme.name}
        style={styles.fill}
      />

      <div className={styles.body.class}>
        {elLayout}
        {elSidebarRight}
      </div>
    </div>
  );
};
