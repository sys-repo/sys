import { type t, Color, R, Style } from './common.ts';
const { GREEN, WHITE, BLUE } = Color;

export const SwitchTheme = {
  merge(base: t.SwitchTheme, theme: Partial<t.SwitchTheme>) {
    const res = R.mergeDeepRight(base, theme) as t.SwitchTheme;
    return R.clone(res);
  },

  fromString(theme: t.CommonTheme) {
    if (theme === 'Light') return SwitchTheme.light;
    if (theme === 'Dark') return SwitchTheme.dark;
    throw new Error(`Theme name '${theme}' not supported.`);
  },

  toShadowCss(shadow: t.CssShadow) {
    return Style.toShadow(shadow);
  },

  get light() {
    const BASE: t.SwitchTheme = {
      trackColor: { on: BLUE, off: -0.1, disabled: -0.1 },
      thumbColor: { on: WHITE, off: WHITE, disabled: WHITE },
      shadowColor: -0.35,
      disabledOpacity: 0.45,
    };
    return {
      default: BASE,
      blue: BASE,
      green: SwitchTheme.merge(BASE, { trackColor: { on: GREEN, off: -0.1, disabled: -0.1 } }),
    };
  },

  get dark() {
    const BASE: t.SwitchTheme = {
      trackColor: { on: BLUE, off: 0.2, disabled: 0.2 },
      thumbColor: { on: WHITE, off: WHITE, disabled: WHITE },
      shadowColor: -0.6,
      disabledOpacity: 0.3,
    };
    return {
      default: BASE,
      blue: BASE,
      green: SwitchTheme.merge(BASE, { trackColor: { on: GREEN, off: 0.2, disabled: 0.2 } }),
    };
  },
};
