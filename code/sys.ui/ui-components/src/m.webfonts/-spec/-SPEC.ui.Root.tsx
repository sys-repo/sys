import React from 'react';
import { Signal } from '../../ui/-test.ui.ts';
import { type t, Color, css, Fonts, useFontBundle } from './common.ts';
import { resolveStyle } from './-ui.FontStyle.tsx';

export type RootProps = {
  debug: t.DebugSignals;
  style?: t.CssInput;
};

/**
 * Component:
 */
export const Root: React.FC<RootProps> = (props) => {
  const { debug } = props;
  const p = debug.props;
  const v = Signal.toObject(p);
  const fontName = (v.font ?? 'ETBook') as t.Fonts.FontName;
  const bundle = Fonts[fontName];
  const style = resolveStyle(fontName, v.weight, v.italic);

  useFontBundle(bundle);

  /**
   * Render:
   */
  const theme = Color.theme(v.theme);
  const styles = {
    base: css({
      color: theme.fg,
      backgroundColor: theme.bg,
      display: 'grid',
      gap: 12,
      Padding: [32, 28],
    }),
    title: css({
      fontSize: 14,
      opacity: 0.6,
      fontFamily: 'monospace',
    }),
    sample: css({
      fontFamily: `"${bundle.config.family}"`,
      fontWeight: style.weight,
      fontStyle: style.italic ? 'italic' : 'normal',
      fontSize: 38,
      lineHeight: 1.15,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.title.class}>
        {bundle.config.family}
        {` / ${style.weight}${style.italic ? ' italic' : ''}`}
      </div>
      <div className={styles.sample.class}>{v.sampleText}</div>
    </div>
  );
};
