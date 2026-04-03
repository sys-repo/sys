import React from 'react';
import { type t, Color, D, Style, Rx } from './common.ts';

const componentAttr = D.displayName;
type P = { theme?: t.CommonTheme };

/**
 * Thin react wrapper
 */
export const useScopedStyles = (props: P) => {
  React.useEffect(() => {
    const styles = initStyles(props);
    return () => styles.dispose();
  }, [props.theme]);
  return { componentAttr } as const;
};

/**
 * Initialize global styles.
 */
export function initStyles(props: P, opts: { life?: t.Lifecycle } = {}) {
  const life = Rx.lifecycle(opts.life);
  const theme = Color.theme(props.theme);
  const sheet = Style.Dom.stylesheet();
  const scope = `[data-component="${componentAttr}"]`;
  const rule = (selector: string, css: t.CssValue) => sheet.rule(`${scope} ${selector}`, css);

  rule('code', {
    backgroundColor: Color.alpha(theme.fg, 0.03),
    color: Color.alpha(theme.fg, 0.8),
    fontFamily: 'monospace',
    fontWeight: 600,
    fontSize: '0.85em',
    lineHeight: 1,
    Padding: [2, 4],
    borderRadius: 4,
    border: `solid 1px ${Color.alpha(theme.fg, 0.15)}`,
  });

  return {
    sheet,
    dispose: () => life.dispose(),
  };
}
