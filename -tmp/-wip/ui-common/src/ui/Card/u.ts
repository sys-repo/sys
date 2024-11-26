import { Color, COLORS, type t } from './common.ts';
import { Flip } from '../Flip/mod.ts';

export const Wrangle = {
  userSelect(props: t.CardProps): React.CSSProperties['userSelect'] {
    let value = props.userSelect;
    value = value ?? false;
    value = value === true ? 'auto' : value;
    value = value === false ? 'none' : value;
    return value as React.CSSProperties['userSelect'];
  },

  size(props: t.CardProps) {
    const width = typeof props.width === 'number' ? { fixed: props.width } : props.width;
    const height = typeof props.height === 'number' ? { fixed: props.height } : props.height;
    return { width, height };
  },

  bg(props: t.CardProps) {
    const { background = {} } = props;
    const { color = 1, blur } = background;
    return { color, blur };
  },

  border(props: t.CardProps) {
    const { border, focused } = props;
    const color = border?.color ?? focused ? COLORS.BLUE : Color.alpha(COLORS.DARK, 0.25);
    const radius = props.border?.radius ?? 4;
    return { color, radius };
  },

  shadow(props: t.CardProps): t.CssShadow | undefined {
    const { shadow, focused } = props;
    if (shadow === false) return undefined;
    if (shadow === true || shadow === undefined) {
      return {
        y: 2,
        color: Color.alpha(COLORS.DARK, focused ? 0.15 : 0.1),
        blur: focused ? 15 : 6,
      };
    }
    return shadow;
  },

  showBackside(props: t.CardProps): t.CardBackside {
    let flipped = false;
    let speed: number = Flip.DEFAULTS.speed;
    if (!props.showBackside) return { flipped, speed };
    if (props.backside) {
      if (props.showBackside === true) flipped = true;
      if (typeof props.showBackside === 'object') {
        flipped = props.showBackside.flipped ?? false;
        speed = props.showBackside.speed ?? speed;
      }
    }
    return { flipped, speed };
  },

  canFocus(props: t.CardProps) {
    return props.onFocusChange || typeof props.focused === 'boolean';
  },

  tabIndex(props: t.CardProps) {
    if (typeof props.tabIndex === 'number') return props.tabIndex;
    return Wrangle.canFocus(props) ? 0 : undefined;
  },
};
