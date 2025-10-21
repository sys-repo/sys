import React from 'react';
import { type t, Color, D, css } from './common.ts';
import { Stream } from './ui.Stream.tsx';

type P = t.VideoRecorderViewProps;

/**
 * Component:
 */
export const Main: React.FC<P> = (props) => {
  const camId = props.signals?.camera.value?.deviceId ?? null;
  const micId = props.signals?.audio.value?.deviceId ?? null;
  const streamKey = `cam:${camId ?? 'none'}|mic:${micId ?? 'none'}`;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({ color: theme.fg, display: 'grid', overflow: 'hidden' }),
    body: css({
      width: 750,
      aspectRatio: D.aspectRatio, // 🐷
      display: 'grid',
    }),
  };

  // Guard: no pre-mount → wait until the camera stream has resolved.
  if (!camId) return null;

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.body.class}>
        <Stream key={streamKey} {...props} />
      </div>
    </div>
  );
};
