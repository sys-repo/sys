import type { t } from '../common.ts';
import { ScreenPlatform } from './u.platform.ts';

type Measurement = {
  readonly width?: number;
  readonly height?: number;
};

type Measure = () => Measurement | undefined;

const FALLBACK: t.CliScreenSize = { width: 80, height: 24 };

/** Create a terminal-size reader over an injected raw measurement source. */
export function createSize(measure: Measure): t.CliScreenLib['size'] {
  return () => {
    const current = measure();
    return {
      width: current?.width ?? FALLBACK.width,
      height: current?.height ?? FALLBACK.height,
    };
  };
}

export const size = createSize(ScreenPlatform.measure);
