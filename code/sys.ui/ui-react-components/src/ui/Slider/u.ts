import { type t, D, DEFAULTS, Num, Color } from './common.ts';

/**
 * Helpers
 */
export const Wrangle = {
  percent(value?: number) {
    return Num.Percent.clamp(value);
  },

  props(props: t.SliderProps) {
    const theme = Color.theme(props.theme);
    const tracks = Wrangle.tracks(theme, props.track);
    const thumb = Wrangle.thumb(theme, props.thumb);
    const ticks = Wrangle.ticks(theme, props.ticks);
    return { tracks, thumb, ticks } as const;
  },

  elementToPercent(el: HTMLDivElement, clientX: number) {
    const totalWidth = el.offsetWidth;
    const position = clientX - el.getBoundingClientRect().left;
    const res = totalWidth <= 0 ? 0 : Wrangle.percent(position / totalWidth);
    return Number(res.toFixed(3));
  },

  /**
   * Track
   */
  tracks(theme: t.ColorTheme, input?: t.SliderProps['track']): t.SliderTrackProps[] {
    const tracks = Array.isArray(input) ? input : [input];
    return tracks.map((track) => Wrangle.track(theme, track));
  },

  track(theme: t.ColorTheme, track?: Partial<t.SliderTrackProps>): t.SliderTrackProps {
    const D = DEFAULTS.track(theme);
    return {
      height: track?.height ?? D.height,
      percent: track?.percent,
      border: track?.border ?? D.border,
      highlight: track?.highlight ?? D.highlight,
      highlightBorder: track?.highlightBorder ?? D.highlightBorder,
    };
  },

  /**
   * Thumb
   */
  thumb(theme: t.ColorTheme, thumb?: t.SliderProps['thumb']): t.SliderThumbProps {
    const DEFAULT = D.thumb(theme);
    return {
      size: thumb?.size ?? DEFAULT.size,
      opacity: thumb?.opacity ?? DEFAULT.opacity,
      pressedScale: thumb?.pressedScale ?? DEFAULT.pressedScale,
      color: thumb?.color ?? DEFAULT.color,
      border: thumb?.border ?? DEFAULT.border,
    };
  },

  thumbLeft(percent: t.Percent, totalWidth: t.Pixels, thumbSize: t.Pixels) {
    return (totalWidth - thumbSize) * percent;
  },

  /**
   * Ticks
   */
  ticks(theme: t.ColorTheme, ticks?: t.SliderProps['ticks']): t.SliderTickProps {
    const DEFAULT = D.ticks(theme);
    return {
      offset: ticks?.offset ?? DEFAULT.offset,
      items: ticks?.items ?? DEFAULT.items,
    };
  },

  tickItems(input?: t.SliderTickInput[]): t.SliderTick[] {
    if (!Array.isArray(input)) return [];
    const isNumber = (value: any): value is number => typeof value === 'number';
    const isObject = (value: any): value is t.SliderTick => typeof value === 'object';
    return input
      .filter((item) => isNumber(item) || isObject(item))
      .map((value) => (isObject(value) ? value : ({ value } as t.SliderTick)));
  },
} as const;
