import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, Crdt, css, D, Media, Rx, Signal } from './common.ts';

type P = t.VideoRecorderViewProps;

/**
 * Component:
 */
export const Config: React.FC<P> = (props) => {
  const { debug = false, repo, signals = {} } = props;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      borderLeft: `solid 1px ${Color.alpha(theme.fg, 0.15)}`,
      padding: 10,
      minWidth: 340,
    }),
    hr: css({
      border: 'none',
      borderTop: `solid 1px ${Color.alpha(theme.fg, 0.15)}`,
      MarginY: 20,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Media.Devices.UI.List
        filter={(e) => e.kind === 'videoinput'}
        theme={theme.name}
        selected={signals.camera?.value}
        onSelect={(e) => {
          if (signals.camera) signals.camera.value = e.info;
        }}
      />
      <hr className={styles.hr.class} />

      <Media.Devices.UI.List
        filter={(e) => e.kind === 'audioinput'}
        theme={theme.name}
        selected={signals.audio?.value}
        onSelect={(e) => {
          if (signals.audio) signals.audio.value = e.info;
        }}
      />
    </div>
  );
};
