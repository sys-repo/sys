import React, { useRef } from 'react';
import { Color, css, type t, useSizeObserver } from './common.ts';
import { useAudioAnalyser } from './use.AudioAnalyser.ts';
import { useDrawWaveform } from './use.DrawWaveform.ts';

/**
 * Paints an audio waveform to a <canvas> element.
 *
 * Samples:
 *    https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Visualizations_with_Web_Audio_API
 *    https://www.twilio.com/blog/audio-visualisation-web-audio-api--react
 */
export const AudioWaveform: React.FC<t.AudioWaveformProps> = (props) => {
  const { debug = false } = props;
  const { width = 300, height = 30, stream, lineWidth } = props;
  const theme = Color.theme(props.theme);
  const lineColor = props.lineColor ?? theme.fg;

  /* DOM refs: */
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /* Hooks: */
  const size = useSizeObserver();
  const analyser = useAudioAnalyser({ stream });
  const { audioData } = analyser;
  useDrawWaveform({ canvasRef, audioData, lineColor, lineWidth });

  const isReady = size.ready;

  /**
   * Effect: resize canvas
   */
  React.useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !size.ready) return;
    if (size.width === 0 || size.height === 0) return;

    const dpr = window.devicePixelRatio ?? 1;
    canvas.width = Math.floor(size.width * dpr);
    canvas.height = Math.floor(size.height * dpr);
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
  }, [size.ready, size.width, size.height]);

  /**
   * Render:
   */
  const styles = {
    base: css({
      position: 'relative',
      display: 'block',
      opacity: isReady ? 1 : 0,
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      width: '100%',
      height: '100%',
    }),
    canvas: css({ Absolute: 0, width: '100%', height: '100%' }),
  };

  return (
    <div ref={size.ref} className={css(styles.base, props.style).class}>
      <canvas ref={canvasRef} className={styles.canvas.class} />
    </div>
  );
};
