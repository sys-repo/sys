import type { t } from '../common.ts';
import { ScreenMeasure, type ScreenMeasurement } from './u.measure.ts';
import { ScreenPlatform } from './u.platform.ts';

type Measure = () => ScreenMeasurement | undefined;

const FALLBACK: t.CliScreenSize = { width: 80, height: 24 };

/** Create a terminal-size reader over an injected raw measurement source. */
export function createSize(measure: Measure): t.CliScreenLib['size'] {
  return () => {
    const current = measure();
    return {
      width: ScreenMeasure.dimension(current?.width) ?? FALLBACK.width,
      height: ScreenMeasure.dimension(current?.height) ?? FALLBACK.height,
    };
  };
}

export const size = createSize(ScreenPlatform.measure);
