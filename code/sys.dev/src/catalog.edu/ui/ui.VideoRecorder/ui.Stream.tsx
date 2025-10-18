import React, { useEffect, useRef, useState } from 'react';
import { type t, Color, css, D, Media, Rx, Signal } from './common.ts';

type P = t.VideoRecorderViewProps;

/**
 * Component:
 */
export const Stream: React.FC<P> = (props) => {
  const { debug = false, signals } = props;

  const cameraId = signals?.camera.value?.deviceId;
  const audioId = signals?.audio.value?.deviceId;
  const streamKey = `cam:${cameraId ?? 'default'}|mic:${audioId ?? 'default'}`;

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({}),
  };

  return (
    <Media.Video.UI.Stream
      key={streamKey}
      debug={debug}
      debugFilter={(e) => {
        return e.key.endsWith('.id') || e.key.endsWith('.device') || e.key.endsWith('.label');
        return true;
      }}
      style={css(styles.base, props.style)}
      theme={theme.name}
      constraints={{
        audio: {
        },
        video: {
        },
      }}
      onReady={(e) => {
        console.info(`⚡️ Video.Stream.onReady:`, e);
        if (signals) signals.stream.value = e.stream.filtered ?? e.stream.raw;
      }}
    />
  );
};
