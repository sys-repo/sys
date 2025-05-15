import { type t, pkg, Pkg, Color } from '../common.ts';
export * from '../common.ts';

type Mutate<T> = (draft: T) => void;

/**
 * Constants:
 */
const name = 'Slider';
export const DEFAULTS = {
  name,
  displayName: Pkg.toString(pkg, name),

  enabled: true,
  percent: 0,

  track(edit?: Mutate<t.SliderTrackProps>) {
    const obj: t.SliderTrackProps = {
      percent: undefined,
      height: 20,
      color: {
        default: Color.alpha(Color.DARK, 0.06),
        border: Color.alpha(Color.DARK, 0.06),
        highlight: Color.BLUE,
      },
    };
    edit?.(obj);
    return obj;
  },

  thumb(edit?: Mutate<t.SliderThumbProps>) {
    const obj: t.SliderThumbProps = {
      size: 20,
      pressedScale: 1.1,
      opacity: 1,
      color: {
        default: Color.WHITE,
        border: Color.alpha(Color.DARK, 0.2),
      },
    };
    edit?.(obj);
    return obj;
  },

  ticks(edit?: Mutate<t.SliderTickProps>) {
    const obj: t.SliderTickProps = {
      offset: { top: 5, bottom: 5 },
      items: [],
    };
    edit?.(obj);
    return obj;
  },
} as const;
export const D = DEFAULTS;
