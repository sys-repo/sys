import React from 'react';
import { Color } from './common.ts';

type Props = {
  lineColor?: string | number;
  lineWidth?: number;
};

/**
 * Renders an oscilloscope waveform visualization to a <canvas>.
 *
 * Sample:
 *    https://www.twilio.com/blog/audio-visualisation-web-audio-api--react
 *
 */
export function useDrawWaveform(
  args: { canvasRef?: React.RefObject<HTMLCanvasElement>; audioData?: Uint8Array } & Props,
) {
  React.useEffect(() => {
    const { audioData, lineColor, lineWidth } = args;
    const canvas = args.canvasRef?.current;
    if (canvas && audioData) draw({ canvas, audioData, lineColor, lineWidth });
  });
}

/**
 * [Helpers]
 */
const draw = (args: { canvas: HTMLCanvasElement; audioData: Uint8Array } & Props) => {
  const { canvas, audioData } = args;
  const lineColor = args.lineColor ?? -0.6;

  const { width, height } = canvas;
  const ctx = canvas.getContext('2d');
  const sliceWidth = (width * 1.0) / audioData.length;
  let x = 0;

  if (ctx) {
    ctx.lineWidth = args.lineWidth ?? 1;
    ctx.strokeStyle = Color.format(lineColor) as string;
    ctx.clearRect(0, 0, width, height);

    ctx.beginPath();
    ctx.moveTo(0, height / 2);

    audioData.forEach((item) => {
      const y = (item / 255.0) * height;
      ctx.lineTo(x, y);
      x += sliceWidth;
    });

    ctx.lineTo(x, height / 2);
    ctx.stroke();
  }
};
