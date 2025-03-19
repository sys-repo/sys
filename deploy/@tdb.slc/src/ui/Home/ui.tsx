import React from 'react';
import { CanvasMini } from '../Canvas.Mini/mod.ts';
import { type t, CanvasPanelList, Color, css, Player, rx, Signal, Time } from './common.ts';

export const Home: React.FC<t.HomeProps> = (props) => {
  const videoSignalsRef = React.useRef(
    Player.Video.signals({
      autoPlay: true,
      muted: true,
      showControls: false,
      loop: true,
    }),
  );

  const selectedPanel = Signal.useSignal<t.CanvasPanel>('purpose');

  Signal.useRedrawEffect(() => {
    selectedPanel.value;
  });

  /**
   * Effect: Keyboard.
   */
  React.useEffect(() => {
    const life = rx.disposable();
    const keyboard = Keyboard.until(life.dispose$);
    keyboard.on('Enter', () => (window.location.search = '?d'));
    return life.dispose;
  });

  /**
   * Effect: Cycle the selected SLC panel.
   */
  React.useEffect(() => {
    const msecs = 2_000;
    const life = rx.lifecycle();

    const next = async () => {
      if (life.disposed) return;
      Signal.cycle(selectedPanel, CanvasPanelList);
      Time.delay(msecs, next);
    };

    Time.delay(msecs, next);
    return life.dispose;
  }, []);

  /**
   * Render
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ position: 'relative', backgroundColor: Color.DARK, color: theme.fg }),
    body: css({ Absolute: 10, display: 'grid', placeItems: 'center' }),
    video: {
      base: css({ Absolute: 0, display: 'grid' }),
      player: css({ opacity: 0.2 }),
    },
  };

  const elVideo = (
    <div className={styles.video.base.class}>
      <Player.Video.View
        style={styles.video.player}
        video={'vimeo/499921561'}
        signals={videoSignalsRef.current}
      />
    </div>
  );

  const elBody = (
    <div className={styles.body.class}>
      <CanvasMini theme={'Dark'} selected={selectedPanel.value} />
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      {elVideo}
      {elBody}
    </div>
  );
};
