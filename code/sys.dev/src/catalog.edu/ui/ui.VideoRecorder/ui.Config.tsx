import React from 'react';

import { type t, Color, css, Media } from './common.ts';
import { ConfigDevices } from './ui.Config.Devices.tsx';
import { Footer } from './ui.Config.Footer.tsx';

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
      display: 'grid',
      gridTemplateRows: '1fr auto',
    }),
    body: css({ boxSizing: 'border-box', padding: 10, paddingTop: 20 }),
    footer: css({}),
    hr: css({ border: 'none', borderTop: `solid 1px ${Color.alpha(theme.fg, 0.15)}`, MarginY: 20 }),
    mediaList: css({ marginRight: 10 }),
    waveform: css({
      marginTop: 10,
      MarginX: [19, 18.5],
      borderLeft: `solid 1px ${Color.alpha(theme.fg, 0.08)}`,
      borderRight: `solid 1px ${Color.alpha(theme.fg, 0.08)}`,
    }),
  };

  const elBody = (
    <div className={styles.body.class}>
      <ConfigDevices
        base={props}
        kind={'videoinput'}
        signal={signals?.camera}
        style={styles.mediaList}
      />

      <hr className={styles.hr.class} />

      <ConfigDevices
        base={props}
        kind={'audioinput'}
        signal={signals?.audio}
        style={styles.mediaList}
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

  return (
    <div className={css(styles.base, props.style).class}>
      {elBody}
      <Footer {...props} />
    </div>
  );
};
