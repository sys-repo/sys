import type { t } from './common.ts';

export type LandingCanvasPosition = 'Center' | 'Center:Bottom';

/**
 * Signals:
 */
export type LandingSignalsFactory = (defaults?: LandingSignalsFactoryDefaults) => t.LandingSignals;
/** Defaults passed to the signals API factory. */
export type LandingSignalsFactoryDefaults = {
  canvasPosition?: t.LandingCanvasPosition;
  sidebarVisible?: boolean;
};

/**
 * Signals API for dynamic control of the <VideoPlayer>.
 */
export type LandingSignals = {
  props: {
    ready: t.Signal<boolean>;
    canvasPosition: t.Signal<t.LandingCanvasPosition>;
    sidebarVisible: t.Signal<boolean>;
  };
};

/**
 * <Component>:
 */
export type Landing1Props = {
  theme?: t.CommonTheme;
  style?: t.CssInput;
  signals?: t.LandingSignals;
};
