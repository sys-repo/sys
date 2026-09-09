import { Color, css, Is, Obj, type t } from './common.ts';
import { SwitchTheme } from './u.theme.ts';

export type SwitchThumbProps = {
  thumb: Partial<t.Switch.Theme.Thumb>;
  switch: {
    isLoaded: boolean;
    isEnabled: boolean;
    value: boolean;
    theme: t.Switch.Theme.Root;
    width: number;
    height: number;
    transitionSpeed: number;
  };
};

export const SwitchThumb: React.FC<SwitchThumbProps> = (props) => {
  const parent = props.switch;
  const { isEnabled, isLoaded, value: on } = parent;
  const thumb = toThumb(parent.theme, props.thumb, parent);

  const themeColor = wrangle.color(
    isEnabled ? (on ? thumb.color.on : thumb.color.off) : thumb.color.disabled,
  );

  const { width, height } = thumb;
  const x = on ? parent.width - (width + thumb.xOffset) : 0 + thumb.xOffset;
  const y = thumb.yOffset;

  const speed = `${props.switch.transitionSpeed}ms`;
  const transition = `left ${speed}, background-color ${speed}`;

  const styles = {
    base: css({
      Absolute: [y, null, null, x],
      cursor: isEnabled ? 'pointer' : undefined,
      display: 'block',
      width,
      height,
      boxSizing: 'border-box',
      borderRadius: thumb.borderRadius,
      backgroundColor: themeColor,
      transition: isLoaded ? transition : undefined,
      boxShadow: SwitchTheme.toShadowCss(thumb.shadow),
    }),
  };

  return <span className={styles.base.class} aria-hidden='true' />;
};

/**
 * Helpers:
 */
function toThumb(
  theme: t.Switch.Theme.Root,
  thumb: Partial<t.Switch.Theme.Thumb>,
  parent: { width: number; height: number },
): t.Switch.Theme.Thumb {
  const offset = {
    x: thumb.xOffset ?? 2,
    y: thumb.yOffset ?? 2,
  };

  const height = parent.height - offset.y * 2;
  const width = height;

  const defaultThumb: t.Switch.Theme.Thumb = {
    width,
    height,
    xOffset: offset.x,
    yOffset: offset.y,
    color: theme.thumbColor,
    borderRadius: height / 2,
    shadow: { x: 0, y: 2, blur: 4, color: theme.shadowColor },
  };
  const res: t.Switch.Theme.Thumb = {
    ...defaultThumb,
    ...thumb,
    color: { ...defaultThumb.color, ...(thumb.color ?? {}) },
    shadow: { ...defaultThumb.shadow, ...(thumb.shadow ?? {}) },
  };
  return Obj.clone(res);
}

const wrangle = {
  color(value: string | number) {
    return Is.str(value) ? value : Color.toGrayAlpha(value);
  },
} as const;
