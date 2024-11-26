import { Color, css, R, type t } from './common.ts';
import { SwitchTheme } from './theme.ts';

export type SwitchThumbProps = {
  thumb: Partial<t.SwitchThumb>;
  switch: {
    isLoaded: boolean;
    isEnabled: boolean;
    value: boolean;
    theme: t.SwitchTheme;
    width: number;
    height: number;
    transitionSpeed: number;
  };
};

export const SwitchThumb: React.FC<SwitchThumbProps> = (props) => {
  const parent = props.switch;
  const { isEnabled, isLoaded, value: on } = parent;
  const thumb = toThumb(parent.theme, props.thumb, parent);

  const themeColor = Color.format(
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
      cursor: isEnabled ? 'pointer' : 'undefined',
      width,
      height,
      boxSizing: 'border-box',
      borderRadius: thumb.borderRadius,
      backgroundColor: themeColor,
      transition: isLoaded ? transition : undefined,
      boxShadow: SwitchTheme.toShadowCss(thumb.shadow),
    }),
  };

  return <div {...styles.base} />;
};

/**
 * [Helpers]
 */

function toThumb(
  theme: t.SwitchTheme,
  thumb: Partial<t.SwitchThumb>,
  parent: { width: number; height: number },
): t.SwitchThumb {
  const offset = {
    x: thumb.xOffset ?? 2,
    y: thumb.yOffset ?? 2,
  };

  const height = parent.height - offset.y * 2;
  const width = height;

  const defaultThumb: t.SwitchThumb = {
    width,
    height,
    xOffset: offset.x,
    yOffset: offset.y,
    color: theme.thumbColor,
    borderRadius: height / 2,
    shadow: { x: 0, y: 2, blur: 4, color: theme.shadowColor },
  };
  const res = R.mergeDeepRight(defaultThumb, thumb) as t.SwitchThumb;
  return R.clone(res);
}
