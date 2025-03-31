import React from 'react';
import { chromeDark, chromeLight, ObjectInspector } from 'react-inspector';
import { type t, css, DEFAULTS } from './common.ts';

const D = DEFAULTS;

export const Obj: React.FC<t.ObjProp> = (props) => {
  const { block = D.block } = props;

  /**
   * Render:
   */

  const styles = {
    base: css({
      display: block ? 'block' : 'inline-block',
    }),
  };

  const theme = wrangle.theme(props);
  const el = <ObjectInspector data={props.data} name={props.name} theme={theme as any} />;
  return <div className={css(styles.base, props.style).class}>{el}</div>;
};

/**
 * Helpers
 */
const wrangle = {
  theme(props: t.ObjProp) {
    const fontSize = `${props.fontSize ?? DEFAULTS.font.size}px`;
    const lineHeight = '1.5em';
    return {
      ...wrangle.baseTheme(props.theme),
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
} as const;
