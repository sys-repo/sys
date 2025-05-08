import React, { useRef } from 'react';
import { type t, Color, css } from './common.ts';
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

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { audioData } = useAudioAnalyser({ stream });
  useDrawWaveform({ canvasRef, audioData, lineColor, lineWidth });

  /**
   * Render:
   */
  const styles = {
    base: css({
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      width,
      height,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <canvas ref={canvasRef} width={width} height={height} />
    </div>
  );
};
