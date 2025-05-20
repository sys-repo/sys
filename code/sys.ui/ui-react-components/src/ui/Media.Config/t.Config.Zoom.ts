import type { t } from './common.ts';

/**
 * Tools for configurating zoom settings on a media-stream.
 */
export type MediaZoomLib = {
  readonly UI: { readonly List: React.FC<t.MediaZoomProps> };

  /** A map of the default configuration settings. */
  readonly config: t.MediaZoomConfigMap;

  /** Construct a partial map of zoom values. */
  values(keys: (keyof t.MediaZoomValues)[]): Partial<t.MediaZoomValues>;

  /**
   * 0–100 → 0–1
   * e.g. 50 → 0.5
   */
  toRatio(input?: Partial<t.MediaZoomValues>): t.MediaZoomValues;

  /**
   * 0–1 → 0–100
   * e.g. 0.5 → 50
   */
  fromRatio(ratio?: Partial<t.MediaZoomValues>): t.MediaZoomValues;
};

/**
 * <Component>:
 */
export type MediaZoomProps = {
  debug?: boolean;
  debounce?: t.Msecs;
  config?: Partial<t.MediaZoomConfigMap>;
  values?: Partial<t.MediaZoomValues>;

  // Appearance:
  theme?: t.CommonTheme;
  style?: t.CssInput;

  // Handlers:
  onChange?: t.MediaZoomChangeHandler;
  onChanged?: t.MediaZoomChangeHandler;
};

/**
 * Settings for applying a zoom effect to a media-stream.
 */
export type MediaZoomValues = {
  /** Zoom factor: e.g. 2 = 2× zoom; 1 = no zoom. */
  factor: t.Percent;
  /** Zoom center offset as fraction of width: 0 = far left, 0.5 = center, 1 = far right. */
  centerX: t.Percent;
  /** Zoom center offset as fraction of height: 0 = top, 0.5 = middle, 1 = bottom. */
  centerY: t.Percent;
};

/** A map of zoom configuration settings. */
export type MediaZoomConfigMap = { [K in keyof MediaZoomValues]: MediaZoomConfig };
export type MediaZoomConfig = { range: t.MinMaxNumberRange; unit: string; initial: number };

/**
 * Event: fires when a single media-zoom settings change.
 */
export type MediaZoomChangeHandler = (e: MediaZoomChangeArgs) => void;
export type MediaZoomChangeArgs = {
  readonly change: t.MediaSliderChangeArgs;
  readonly values: Partial<t.MediaZoomValues>;
};
