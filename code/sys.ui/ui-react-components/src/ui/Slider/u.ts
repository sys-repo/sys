import { type t, DEFAULTS, Num } from './common.ts';

/**
 * Helpers
 */
export const Wrangle = {
  percent(value?: number) {
    return Num.Percent.clamp(value);
  },

  props(props: t.SliderProps) {
    const tracks = Wrangle.tracks(props.track);
    const thumb = Wrangle.thumb(props.thumb);
    const ticks = Wrangle.ticks(props.ticks);
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
  tracks(input?: t.SliderProps['track']): t.SliderTrackProps[] {
    const tracks = Array.isArray(input) ? input : [input];
    return tracks.map((track) => Wrangle.track(track));
  },

  track(track?: Partial<t.SliderTrackProps>): t.SliderTrackProps {
    const DEFAULT = DEFAULTS.track();
    return {
      height: track?.height ?? DEFAULT.height,
      percent: track?.percent,
      color: {
        default: track?.color?.default ?? DEFAULT.color.default,
        highlight: track?.color?.highlight ?? DEFAULT.color.highlight,
        border: track?.color?.border ?? DEFAULT.color.border,
      },
    };
  },

  /**
   * Thumb
   */
  thumb(thumb?: t.SliderProps['thumb']): t.SliderThumbProps {
    const DEFAULT = DEFAULTS.thumb();
    return {
      size: thumb?.size ?? DEFAULT.size,
      opacity: thumb?.opacity ?? DEFAULT.opacity,
      color: thumb?.color ?? DEFAULT.color,
      pressedScale: thumb?.pressedScale ?? DEFAULT.pressedScale,
    };
  },

  thumbLeft(percent: t.Percent, totalWidth: t.Pixels, thumbSize: t.Pixels) {
    return (totalWidth - thumbSize) * percent;
  },

  /**
   * Ticks
   */
  ticks(ticks?: t.SliderProps['ticks']): t.SliderTickProps {
    const DEFAULT = DEFAULTS.ticks();
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
