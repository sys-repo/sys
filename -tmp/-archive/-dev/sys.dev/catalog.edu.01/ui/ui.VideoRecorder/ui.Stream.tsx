import React from 'react';
import { type t, Color, css, D, logInfo, Media, Signal } from './common.ts';
import { bestAudio, bestVideo, simpleAudio } from './u.constraints.ts';

type P = t.VideoRecorderViewProps;

export const Stream: React.FC<P> = (props) => {
  const { debug = false, signals, aspectRatio = D.aspectRatio } = props;

  const camId = signals?.camera.value?.deviceId;
  const micId = signals?.audio.value?.deviceId;

  /**
   * Bridge Signals → React: only camera/audio should trigger a bump.
   */
  const [, bump] = React.useState(0);
  React.useEffect(() => {
    if (!signals) return;
    return Signal.effect(() => {
      void signals.camera.value;
      void signals.audio.value;
      bump((n) => n + 1);
    });
  }, [signals]);

  /**
   * Drop stream reference on unmount so UI remains current (not stale).
   */
  React.useEffect(() => {
    return () => {
      if (signals) signals.stream.value = undefined;
    };
  }, [signals]);

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  return (
    <Media.Video.UI.Stream
      debug={debug}
      style={css({}, props.style)}
      theme={theme.name}
      constraints={{
        audio: micId ? bestAudio(micId, 'clean') : false, // NB: do not ask for audio until a real mic-id as been acquired.
        video: camId ? bestVideo(camId, { aspectRatio }) : false,
      }}
      onReady={(e) => {
        const stream = e.stream.filtered ?? e.stream.raw;
        if (signals) signals.stream.value = stream;
        if (stream) logInfo('stream:ready', Media.Recorder.captureInfo(stream));
      }}
      onError={(e) => {
        logInfo('getUserMedia error', e.err);
        if (signals) signals.stream.value = undefined;
        props.onStreamError?.(e);
      }}
    />
  );
};
