import { chromeDark, chromeLight } from 'react-inspector';
import { DEFAULTS, type t } from './common.ts';

export const Wrangle = {
  data(props: t.ObjectViewProps) {
    const { data, format = true } = props;
    if (!format || !data || data === null) return data;
    const formatter = typeof format === 'function' ? format : DEFAULTS.formatter;
    return formatter(data);
  },

  theme(props: t.ObjectViewProps) {
    const fontSize = `${props.fontSize ?? DEFAULTS.font.size}px`;
    const lineHeight = '1.5em';
    return {
      ...Wrangle.baseTheme(props.theme),
      BASE_BACKGROUND_COLOR: 'transparent',
      BASE_FONT_SIZE: fontSize,
      TREENODE_FONT_SIZE: fontSize,
      BASE_LINE_HEIGHT: lineHeight,
      TREENODE_LINE_HEIGHT: lineHeight,
    };
  },

  baseTheme(theme?: t.CommonTheme) {
    theme = theme ?? DEFAULTS.theme;
    if (theme === 'Light') return chromeLight;
    if (theme === 'Dark') return chromeDark;
    throw new Error(`Theme '${theme}' not supported.`);
  },

  expand(props: t.ObjectViewProps) {
    const { expand } = props;
    let expandLevel: number | undefined = undefined;
    let expandPaths: string[] | undefined;

    if (typeof expand === 'number') {
      expandLevel = expand;
    }

    if (typeof expand === 'object') {
      expandLevel = expand.level;
      expandPaths = Array.isArray(expand.paths) ? expand.paths : undefined;
    }

    return { expandLevel, expandPaths };
  },
} as const;
