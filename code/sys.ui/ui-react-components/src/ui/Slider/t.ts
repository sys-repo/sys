import type { t } from './common.ts';

type Color = string | number;

/**
 * Component
 */
export type SliderProps = {
  debug?: boolean;
  enabled?: boolean;
  width?: number;
  percent?: t.Percent;
  track?: Partial<t.SliderTrackProps> | Partial<t.SliderTrackProps>[];
  ticks?: Partial<t.SliderTickProps>;
  thumb?: Partial<t.SliderThumbProps>;
  theme?: t.CommonTheme;
  style?: t.CssInput;
  onChange?: t.SliderChangeHandler;
};

/**
 * Slider → Track
 */
export type SliderTrackProps = {
  height: t.Pixels;
  percent?: t.Percent; // If present, overrides the parent "percent" prop.
  color: { default: Color; highlight: Color; border: Color };
};

/**
 * Slider → Thumb
 */
export type SliderThumbProps = {
  size: t.Pixels;
  opacity: t.Percent;
  pressedScale: number; // eg: 1.1
  color: { default: Color; border: Color };
};

/**
 * Slider → Tick Marks
 */
export type SliderTickProps = {
  offset: { top: t.Pixels; bottom: t.Pixels };
  items: SliderTickInput[];
};

export type SliderTickInput = t.Percent | SliderTick | undefined | false;
export type SliderTick = {
  value: t.Percent;
  label?: string;
  el?: JSX.Element | false;
};

/**
 * Events
 */
export type SliderChangeHandler = (e: SliderChangeHandlerArgs) => void;
export type SliderChangeHandlerArgs = { percent: t.Percent };
