import React from 'react';
import { Color, pkg, Style } from './common.ts';

const componentAttr = `${pkg.name}:ActionProbe`;

export const useProbeStyles = (fg: string) => {
  React.useEffect(() => {
    const sheet = Style.Dom.stylesheet();
    sheet.rule(`[data-component="${componentAttr}"] code`, {
      fontFamily: 'monospace',
      fontSize: '0.95em',
      lineHeight: 1,
      Padding: [2, 5],
      borderRadius: 4,
      border: `solid 1px ${Color.alpha(fg, 0.2)}`,
      backgroundColor: Color.alpha(fg, 0.05),
    });
  }, [fg]);

  return { componentAttr } as const;
};
