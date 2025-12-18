import { type t, DEFAULTS, Is, Color } from './common.ts';

type P = t.TextInputProps;
type C = string | t.Percent;

/**
 * Calculate border styles.
 */
export function useBorderStyles(props: P, options: { theme?: t.ColorTheme } = {}) {
  const theme = options.theme ?? Color.theme(props.theme);
  const border = wrangle.border(props, theme);
  const borderRadius = wrangle.borderRadius(props, border.mode);

  /**
   * API:
   */
  return { border, borderRadius, theme } as const;
}

/**
 * Helpers:
 */
const wrangle = {
  borderRadius(props: P, mode: t.TextInputBorder['mode']) {
    const px = props.borderRadius ?? DEFAULTS.borderRadius;
    if (mode === 'line:bottom') return `${px}px ${px}px ${0}px ${0}px`;
    if (mode === 'line:top') return `${0}px ${0}px ${px}px ${px}px`;
    return px;
  },

  border(props: P, theme: t.ColorTheme) {
    const D = DEFAULTS.border;
    let defaultColor = D.defaultColor;
    let focusColor = D.focusColor;
    let mode = D.mode;

    let prop = props.border;
    if (prop === true) prop = D;

    if (Is.record(prop)) {
      defaultColor = prop.defaultColor ?? D.defaultColor;
      focusColor = prop.focusColor ?? D.focusColor;
      mode = prop.mode ?? D.mode;
    }

    if (prop === false || mode === 'none') {
      mode = 'none';
      focusColor = 0;
      defaultColor = 0;
    }

    if (props.readOnly) {
      focusColor = 0;
      defaultColor = 0;
    }

    const format = (color: C) => theme.format(color).fg;
    const border = (color: C | false) => (color === false ? 'none' : `1px solid ${format(color)}`);

    const isOutline = mode === 'outline';
    const isTopLine = mode === 'line:top';
    const isBottomLine = mode === 'line:bottom';

    return {
      mode,
      base: {
        borderLeft: border(isOutline ? defaultColor : false),
        borderRight: border(isOutline ? defaultColor : false),
        borderTop: border(isOutline ? defaultColor : isTopLine ? defaultColor : false),
        borderBottom: border(isOutline ? defaultColor : isBottomLine ? defaultColor : false),
      },
      focus: {
        borderLeft: border(isOutline ? focusColor : false),
        borderRight: border(isOutline ? focusColor : false),
        borderTop: border(isOutline ? focusColor : isTopLine ? focusColor : false),
        borderBottom: border(isOutline ? focusColor : isBottomLine ? focusColor : false),
      },
    } as const;
  },
} as const;
