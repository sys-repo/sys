import React, { useEffect, useState } from 'react';
import { chromeDark, chromeLight, ObjectInspector } from 'react-inspector';

import { type t, css, DEFAULTS, Style } from './common.ts';
import { renderer } from './ui.Renderer.tsx';

type P = t.ObjProps;
const D = DEFAULTS;

export const Obj: React.FC<P> = (props) => {
  const { block = D.block, sortKeys = D.sortKeys } = props;
  const { expandLevel, expandPaths } = wrangle.expand(props);
  const show = wrangle.show(props);

  const [key, setKey] = useState(wrangle.key(props));

  /**
   * Effect: ensure key/render when the expand level changes.
   */
  useEffect(() => setKey(wrangle.key(props)), [expandPaths?.join(), expandLevel]);

  /**
   * Render:
   */
  const styles = {
    base: css({
      display: block ? 'block' : 'inline-block',
      ...Style.toMargins(props.margin),
    }),
  };

  const theme = wrangle.theme(props);
  const el = (
    <ObjectInspector
      key={key}
      data={props.data}
      name={props.name}
      theme={theme as any}
      sortObjectKeys={sortKeys}
      showNonenumerable={show?.nonenumerable}
      nodeRenderer={renderer({ rootSummary: show?.rootSummary })}
      expandLevel={expandLevel}
      expandPaths={expandPaths}
    />
  );
  return <div className={css(styles.base, props.style).class}>{el}</div>;
};

/**
 * Helpers
 */
const wrangle = {
  key(props: t.ObjProps) {
    const { expandLevel, expandPaths } = wrangle.expand(props);
    return `obj:${expandLevel ?? 0}:${(expandPaths ?? []).join(',')}`;
  },

  theme(props: t.ObjProps) {
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

  show(props: P): t.ObjShow {
    const D = DEFAULTS.show;
    const { show = {} } = props;
    const { nonenumerable = D.nonenumerable, rootSummary = D.nonenumerable } = show;
    return { nonenumerable, rootSummary };
  },

  expand(props: P) {
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
