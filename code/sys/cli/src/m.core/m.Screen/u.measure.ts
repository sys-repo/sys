import { Num, type t } from '../common.ts';

export type ScreenMeasurement = {
  readonly width?: number;
  readonly height?: number;
};

function dimension(input: unknown): number | undefined {
  return Num.Is.finite(input) && input > 0 ? input : undefined;
}

function size(input?: ScreenMeasurement): t.CliScreen.Size | undefined {
  const width = dimension(input?.width);
  const height = dimension(input?.height);
  return width === undefined || height === undefined ? undefined : { width, height };
}

/** Normalize raw terminal measurements without introducing fallback dimensions. */
export const ScreenMeasure = Object.freeze({ dimension, size });
