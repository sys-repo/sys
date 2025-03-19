import type { t } from './common.ts';

/**
 * Signals:
 */
export type LandingSignalsFactory = (defaults?: LandingSignalsFactoryDefaults) => t.LandingSignals;
/** Defaults passed to the signals API factory. */
export type LandingSignalsFactoryDefaults = {};

/**
 * Signals API for dynamic control of the <VideoPlayer>.
 */
export type LandingSignals = {
  props: {
    ready: t.Signal<boolean>;

  };
};

/**
 * <Component>:
 */
export type LandingProps = {
  theme?: t.CommonTheme;
  style?: t.CssInput;
};
