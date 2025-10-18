import React from 'react';
import { type t, Color, css, Media } from './common.ts';
import { edgeBorder } from './u.ts';

type P = t.VideoRecorderViewProps;

/**
 * Component:
 */
export const Config: React.FC<P> = (props) => {
  const { debug = false, signals } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      color: theme.fg,
      borderLeft: edgeBorder(theme),
      width: 340,
      display: 'grid',
    }),
    body: css({
      boxSizing: 'border-box',
      padding: 10,
      paddingTop: 20,
    }),
    footer: css({ borderTop: edgeBorder(theme) }),
    hr: css({
      border: 'none',
      borderTop: `solid 1px ${Color.alpha(theme.fg, 0.15)}`,
      MarginY: 20,
    }),
    mediaList: css({ marginRight: 10 }),
    waveform: css({ marginTop: 5, PaddingX: [20, 15] }),
  };

  const elBody = (
    <div className={styles.body.class}>
      <Media.Devices.UI.List
        style={styles.mediaList}
        debug={debug}
        theme={theme.name}
        filter={(e) => e.kind === 'videoinput'}
        selected={signals?.camera.value}
        onSelect={(e) => {
          if (signals?.camera) signals.camera.value = e.info;
        }}
      />

      <hr className={styles.hr.class} />

      <Media.Devices.UI.List
        style={styles.mediaList}
        debug={debug}
        theme={theme.name}
        filter={(e) => e.kind === 'audioinput'}
        selected={signals?.audio.value}
        onSelect={(e) => {
          if (signals?.audio) signals.audio.value = e.info;
        }}
      />

      <div className={styles.waveform.class}>
        <Media.UI.AudioWaveform
          debug={debug}
          theme={theme.name}
          stream={signals?.stream.value}
          style={{ height: 40 }}
        />
      </div>
    </div>
  );

  return <div className={css(styles.base, props.style).class}>{elBody}</div>;
};
