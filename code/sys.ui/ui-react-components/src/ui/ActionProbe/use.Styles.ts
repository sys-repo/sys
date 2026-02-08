import React from 'react';
import { type t, Color, pkg, Style } from './common.ts';

const componentAttr = `${pkg.name}:ActionProbe`;

export const useProbeStyles = (props: { theme?: t.CommonTheme }) => {
  React.useEffect(() => {
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
  }, [props.theme]);

  return { componentAttr } as const;
};
