import { COLORS, Color, pkg, type t } from '../common.ts';

export * from '../common.ts';

const theme: t.CommonTheme = 'Light';

export const DEFAULTS = {
  displayName: `${pkg.name}:TextSyntax`,
  theme: {
    default: theme,
    get light(): t.TextSyntaxColors {
      return {
        Brace: COLORS.MAGENTA,
        Predicate: COLORS.MAGENTA,
        Colon: Color.alpha(COLORS.DARK, 0.9),
        Word: { Base: COLORS.DARK, Element: COLORS.CYAN },
      };
    },

    get dark(): t.TextSyntaxColors {
      return {
        Brace: Color.lighten(COLORS.MAGENTA, 10),
        Predicate: Color.lighten(COLORS.MAGENTA, 10),
        Colon: Color.alpha(COLORS.WHITE, 0.8),
        Word: { Base: COLORS.WHITE, Element: COLORS.CYAN },
      };
    },
  },
} as const;
