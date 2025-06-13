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
    return mode === 'underline' ? `${px}px ${px}px ${0}px ${0}px` : px;
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

    const incl = (...modes: t.TextInputBorder['mode'][]) => modes.includes(mode);
    const format = (color: C) => theme.format(color).fg;
    const border = (color: C | false) => (color === false ? 'none' : `1px solid ${format(color)}`);

    return {
      mode,
      base: {
        borderLeft: border(incl('outline') ? defaultColor : false),
        borderRight: border(incl('outline') ? defaultColor : false),
        borderTop: border(incl('outline') ? defaultColor : false),
        borderBottom: border(incl('outline', 'underline') ? defaultColor : 0),
      },
      focus: {
        borderLeft: border(incl('outline') ? focusColor : false),
        borderRight: border(incl('outline') ? focusColor : false),
        borderTop: border(incl('outline') ? focusColor : false),
        borderBottom: border(incl('outline', 'underline') ? focusColor : 0),
      },
    } as const;
  },
} as const;
