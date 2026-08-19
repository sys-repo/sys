import type { t } from '../common.ts';
import { MAX_TERMINAL_CELLS } from '../u/u.layout.ts';

export type ScreenMeasurement = {
  readonly width?: number;
  readonly height?: number;
};

const mathFloor = Math.floor;
const numberIsFinite = Number.isFinite;

function dimension(input: unknown): number | undefined {
  if (typeof input !== 'number' || !numberIsFinite(input)) return;
  const value = mathFloor(input);
  return value > 0 && value <= MAX_TERMINAL_CELLS ? value : undefined;
}

function size(input?: ScreenMeasurement): t.CliScreen.Size | undefined {
  const width = dimension(input?.width);
  const height = dimension(input?.height);
  return width === undefined || height === undefined ? undefined : { width, height };
}

/** Normalize raw terminal measurements without introducing fallback dimensions. */
export const ScreenMeasure = Object.freeze({ dimension, size });
