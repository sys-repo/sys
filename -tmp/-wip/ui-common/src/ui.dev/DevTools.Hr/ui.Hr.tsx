import { COLORS, Color, css, t, R } from '../common';

export type HrProps = {
  style?: t.CssValue;
  marginY?: t.DevHrMargin;
  color?: t.DevHrColor;
  thickness?: number;
  opacity?: number;
};

export const Hr: React.FC<HrProps> = (props) => {
  /**
   * [Render]
   */
  const styles = {
    hr: css({
      pointerEvents: 'none',
      boxSizing: 'border-box',
      border: 'none',
      borderTop: `${Wrangle.borderStyle(props)} ${Wrangle.borderThickness(props)}px`,
      borderColor: Wrangle.color(props.color),
      opacity: Wrangle.opacity(props.opacity),
      Margin: Wrangle.margin(props.marginY),
    }),
  };

  return <div {...css(styles.hr, props.style)} />;
};

/**
 * [Helpers]
 */

const Wrangle = {
  color(value?: t.DevHrColor) {
    const color = value ?? COLORS.DARK;
    return Color.format(color);
  },

  opacity(value?: number) {
    return R.clamp(0, 1, value ?? 0.15);
  },

  borderThickness(props: HrProps) {
    const value = props.thickness ?? 1;
    return value === 0 ? 0 : R.clamp(1, 30, value);
  },

  borderStyle(props: HrProps) {
    return (props.thickness ?? 1) < 0 ? 'dashed' : 'solid';
  },

  margin(value?: t.DevHrMargin): t.CssEdgesInput {
    const DEFAULT = 10;
    const margin = value ?? DEFAULT;
    if (Array.isArray(margin)) {
      const list = margin.slice(0, 2);
      if (list.length === 0) return [DEFAULT, 0, DEFAULT, 0];
      if (list.length === 1) return [list[0], 0, list[0], 0];
      return [list[0], 0, list[1], 0];
    } else {
      return [margin, 0, margin, 0];
    }
  },
};
