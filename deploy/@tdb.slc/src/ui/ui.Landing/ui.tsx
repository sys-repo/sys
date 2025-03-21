import React, { useRef } from 'react';
import { Player } from '../common.ts';
import { CanvasMini } from '../ui.Canvas.Mini/mod.ts';

import { type t, Color, css, DEFAULTS, Signal, VimeoBackground } from './common.ts';
import { Layout } from './ui.Layout.tsx';
import { Logo } from './ui.Logo.tsx';
import { useKeyboard } from './use.Keyboard.ts';
import { useSelectedPanel } from './use.SelectedPanel.ts';

type P = t.LandingProps;

const signalsFactory = () =>
  Player.Video.signals({
    src: 'vimeo/727951677', // Rowan: "group scale",
  });

/**
 * Component:
 */
export const Landing: React.FC<P> = (props) => {
  const { signals } = props;
  const p = signals?.props;
  const canvasPosition = p?.canvasPosition.value ?? DEFAULTS.canvasPosition;

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
  const theme = Color.theme(props.theme ?? 'Dark');
  const styles = {
    base: css({
      position: 'relative',
      color: theme.fg,
      backgroundColor: theme.bg,
      fontFamily: 'sans-serif',
    }),
    fill: css({ Absolute: 0 }),
    logo: css({ Absolute: [null, 15, 12, null] }),
  };

  const elLayout = (
    <Layout
      style={styles.fill}
      theme={theme.name}
      canvas={{
        element: <CanvasMini theme={theme.name} selected={selectedPanel.value} />,
        position: p?.canvasPosition.value,
      }}
      video={{
        element: <Player.Video.View signals={playerSignalsRef.current} />,
      }}
    />
  );

  const elVideoBackground = (
    <VimeoBackground
      video={DEFAULTS.tubes.id}
      opacity={canvasPosition === 'Center' ? 0.3 : 0.15}
      style={styles.fill}
    />
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elVideoBackground}
      {elLayout}
    </div>
  );
};
