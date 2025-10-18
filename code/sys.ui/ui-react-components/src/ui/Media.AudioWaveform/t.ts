import type { t } from './common.ts';

/**
 * <Component>:
 */
export type AudioWaveformProps = {
  debug?: boolean;
  stream?: MediaStream;

  lineColor?: string | number;
  lineWidth?: number;

  theme?: t.CommonTheme;
  style?: t.CssInput;
};
