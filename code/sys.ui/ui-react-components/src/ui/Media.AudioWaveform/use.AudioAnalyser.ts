import React, { useState } from 'react';

/**
 * Setup and maintain an [AudioStream] analyzer.
 *
 * Sample:
 *    https://www.twilio.com/blog/audio-visualisation-web-audio-api--react
 *
 */
export function useAudioAnalyser(args: { stream?: MediaStream }) {
  const [stream, setStream] = useState<MediaStream>();
  const [frame, setFrame] = useState<number>();
  const [audioData, setAudioData] = useState<Uint8Array>();
  const [isActive, setIsActive] = useState<boolean>(false);

  React.useEffect(() => setStream(args.stream), [args.stream]);

  React.useEffect(() => {
    const ctx = new window.AudioContext();
    const analyser = ctx.createAnalyser();
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    const audioTracks = stream?.getAudioTracks() || [];

    const source =
      stream && audioTracks.length > 0 ? ctx.createMediaStreamSource(stream) : undefined;

    const tick = () => {
      analyser.getByteTimeDomainData(dataArray);
      setAudioData(dataArray);
      setFrame(requestAnimationFrame(tick));
    };

    if (source) {
      source.connect(analyser);
      setIsActive(true);
      setFrame(requestAnimationFrame(tick));
    }

    return () => {
      if (typeof frame === 'number') cancelAnimationFrame(frame);
      setIsActive(false);
      analyser.disconnect();
      source?.disconnect();
    };
  }, [stream]);

  /**
   * Public API:
   */
  return { isActive, audioData };
}
