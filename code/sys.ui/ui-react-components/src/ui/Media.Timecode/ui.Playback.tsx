import React from 'react';
import { type t, Player, Color, css, D, KeyValue, Obj, Cropmarks } from './common.ts';

export const Playback: React.FC<t.MediaTimecodePlaybackProps> = (props) => {
  const { debug = false } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
      gridTemplateRows: '420px 1fr',
    }),
    top: css({
      display: 'grid',
      borderBottom: `solid 1px ${Color.alpha(theme.fg, 0.05)}`,
      backgroundColor: 'rgba(255, 0, 0, 0.1)' /* RED */,
    }),
    bottom: css({
      padding: 20,
    }),
  };

  // TEMP 🐷 - from dev-harness signal
  const url = `http://localhost:4040/publish.assets/video/sha256-e9d0c5e3e47eb2ce908798c957ca4d385daefd3ecb8d68d35135910284f68685.webm`;

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.top.class}>
        <Cropmarks theme={theme.name}>
          <Player.Video.Element style={{ width: 420 }} muted={true} src={url} />
        </Cropmarks>
      </div>

      <div className={styles.bottom.class}>
        <KeyValue.View
          theme={theme.name}
          items={[
            { kind: 'title', v: D.displayName },
            { k: 'message', v: '👋 hello, world!' },
          ]}
        />
      </div>
    </div>
  );
};
