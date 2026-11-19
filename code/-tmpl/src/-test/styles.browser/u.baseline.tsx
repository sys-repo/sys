import React from 'react';
import { Color, css, D, type SampleProps, Style } from './common.ts';

/**
 * Paint oracle from 519b15ea8: ui.tsx + use.Styles.ts before the scoped-style repair.
 * Each baseline document receives ONE theme only: never compare against contaminated mixed rules.
 * The original lifecycle did not remove sheet rules; it has no bearing on isolated paint.
 */
export function Baseline(props: SampleProps) {
  const theme = Color.theme(props.theme);
  React.useEffect(() => {
    Style.Dom.stylesheet().rule(`[data-component="${D.displayName}"] code`, {
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
  }, [theme.fg]);

  const styles = {
    base: css({ backgroundColor: Color.ruby(0), color: theme.fg, padding: 10 }, props.style),
  };

  return (
    <div data-component={D.displayName} className={styles.base.class}>
      <div>{`🐷 ${D.displayName}`}</div>
      {props.children}
    </div>
  );
}
