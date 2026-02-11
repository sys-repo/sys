import React from 'react';
import { Signal } from '../../ui/-test.ui.ts';
import { type t, Color, css, Fonts, useFontBundle } from './common.ts';

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
      fontSize: 38,
      lineHeight: 1.15,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <div className={styles.title.class}>{bundle.config.family}</div>
      <div className={styles.sample.class}>{v.sampleText}</div>
    </div>
  );
};
