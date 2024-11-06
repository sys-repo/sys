import { Color, DEFAULTS, R, type t } from './common.ts';

export const CssUtil = {
  /**
   * Convert TextInput props to placeholder style.
   */
  toPlaceholder(props: t.TextInputProps): t.CssValue {
    const { theme, placeholderStyle } = props;
    const isDark = theme === 'Dark';
    const vStyle = props.valueStyle ?? DEFAULTS.theme(theme);

    const pDefaults = DEFAULTS.style.placeholder;
    const pStyle: t.TextInputStyle = {
      italic: placeholderStyle?.italic ?? pDefaults.italic,
      opacity: isDark ? pDefaults.opacity.dark : pDefaults.opacity.light,
    };

    return CssUtil.toTextInput({
      ...props,
      valueStyle: { ...R.clone(vStyle), ...pStyle },
    });
  },

  /**
   * Converts a set of TextInput styles into CSS.
   */
  toTextInput(props: t.TextInputProps): t.CssValue {
    const { theme, isEnabled = true } = props;
    const valueStyle = props.valueStyle ?? DEFAULTS.theme(theme);
    return {
      ...CssUtil.toText(valueStyle, theme),
      color: isEnabled ? Color.format(valueStyle.color) : Color.format(valueStyle.disabledColor),
    };
  },

  /**
   * Converts <Text> style props to a CSS object.
   */
  toText(style: t.TextStyle, theme?: t.CommonTheme): t.CssValue {
    const {
      fontSize,
      color,
      fontFamily,
      align,
      italic,
      opacity,
      letterSpacing,
      lineHeight,
      textShadow,
      uppercase,
    } = CssUtil.pluckText(style, theme);

    return {
      color: Color.format(color),
      fontFamily,
      fontSize,
      fontWeight: CssUtil.fontWeight(style.fontWeight),
      fontStyle: italic ? 'italic' : undefined,
      textAlign: align,
      opacity,
      letterSpacing,
      lineHeight,
      textShadow: CssUtil.toTextShadow(textShadow),
      textTransform: uppercase ? ('uppercase' as React.CSSProperties['textTransform']) : undefined,
    };
  },

  fontWeight(value?: t.TextStyle['fontWeight']): number {
    const weights = DEFAULTS.systemFont.weights;
    if (value === 'light') return weights.light;
    if (value === 'normal') return weights.normal;
    if (value === 'bold') return weights.bold;
    return weights.normal;
  },

  pluckText(style: t.TextStyle, theme?: t.CommonTheme): any {
    const {
      color = -0.7,
      align = 'left',
      italic = false,
      opacity = 1,
      textShadow,
      uppercase = false,
    } = style;

    return {
      ...CssUtil.pluckFont(style, theme),
      color,
      align,
      italic,
      opacity,
      textShadow,
      uppercase,
    };
  },

  pluckFont(style: t.TextStyle, theme?: t.CommonTheme): t.CssValue {
    const {
      fontSize = DEFAULTS.theme(theme).fontSize,
      fontFamily = DEFAULTS.systemFont.sans.family,
      fontWeight = 'normal',
      letterSpacing,
      lineHeight,
    } = style;

    return {
      fontFamily,
      fontSize,
      fontWeight,
      lineHeight,
      letterSpacing,
    } as any;
  },

  /**
   * Produces a `textShadow` CSS value from an array.
   * [0:offset-y, 1:color.format()]
   */
  toTextShadow(value?: string | Array<number | string>) {
    if (value === undefined) return;
    if (typeof value === 'string') return value as string;
    return `0px ${value[0]}px ${Color.format(value[1])}`;
  },
} as const;
