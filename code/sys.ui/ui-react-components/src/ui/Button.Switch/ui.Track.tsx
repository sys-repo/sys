import { Color, css, R, type t } from './common.ts';

export type SwitchTrackProps = {
  track: Partial<t.SwitchTrack>;
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

export const SwitchTrack: React.FC<SwitchTrackProps> = (props) => {
  const parent = props.switch;
  const { isEnabled, isLoaded, value: on } = parent;
  const track = toTrack(parent.theme, props.track, parent);
  const x = track.widthOffset;
  const y = track.heightOffset;

  const themeColor = Color.format(
    isEnabled ? (on ? track.color.on : track.color.off) : track.color.disabled,
  );
  const borderWidth = on ? track.borderWidth.on : track.borderWidth.off;
  const backgroundColor = borderWidth ? undefined : themeColor;

  const speed = `${parent.transitionSpeed}ms`;
  const transition = `border-color ${speed}, background-color ${speed}`;

  const styles = {
    base: css({
      Absolute: [y, x, y, x],
      cursor: isEnabled ? 'pointer' : 'undefined',
      boxSizing: 'border-box',
      borderRadius: track.borderRadius,
      borderWidth,
      borderStyle: borderWidth ? 'solid' : undefined,
      borderColor: themeColor,
      backgroundColor,
      transition: isLoaded ? transition : undefined,
      overflow: 'hidden',
    }),
  };
  return <div {...styles.base} />;
};

/**
 * Helpers:
 */
function toTrack(
  theme: t.SwitchTheme,
  track: Partial<t.SwitchTrack>,
  parent: { width: number; height: number },
): t.SwitchTrack {
  const offset = {
    width: track.widthOffset ?? 0,
    height: track.heightOffset ?? 0,
  };

  const defaultTrack: t.SwitchTrack = {
    widthOffset: offset.width,
    heightOffset: offset.height,
    color: theme.trackColor,
    borderRadius: parent.height / 2,
    borderWidth: { on: undefined, off: undefined }, // NB: undefined === fill background
  };

  const res = R.mergeDeepRight(defaultTrack, track) as t.SwitchTrack;
  return R.clone(res);
}
