import type { t } from './common.ts';

/**
 * <Component>:
 */
export type VideoBackgroundProps = {
  fadeDuration?: t.Secs;
  state: t.AppSignals;
  style?: t.CssInput;
};
