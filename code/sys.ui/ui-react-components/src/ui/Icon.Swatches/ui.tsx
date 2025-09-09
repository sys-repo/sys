import React from 'react';

import { type t, Color, css, D, Num } from './common.ts';
import { Swatch } from './ui.Swatch.tsx';
import { Toolbar } from './ui.Toolbar.tsx';

export const IconSwatches: React.FC<t.IconSwatchesProps> = (props) => {
  const { debug = false, percent = D.percent } = props;

  // Slider → percent → cell size:
  const MIN = props.minSize ?? D.minSize; //                 ← px, smallest cell
  const MAX = props.maxSize ?? D.maxSize; //                 ← px, largest cell
  const cell = Math.round(MIN + (MAX - MIN) * percent); //   ← px
  const iconSize = Math.max(16, Math.round(cell * 0.6)); // ← scale icon inside the cell

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const styles = {
    base: css({
      position: 'relative',
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      display: 'grid',
      gridTemplateRows: 'auto 1fr',
      gap: 15,
    }),
    body: {
      base: css({ position: 'relative' }),
      inner: css({ Absolute: 0, Scroll: true, padding: 15 }),
      layout: css({
        display: 'grid',
        gap: 15,
        gridTemplateColumns: `repeat(auto-fit, minmax(${cell}px, 1fr))`,
        alignContent: 'start',
      }),
    },
  };

  const elBody = (
    <div className={styles.body.base.class}>
      <div className={styles.body.inner.class}>
        <div className={styles.body.layout.class}>
          <Swatch theme={theme.name} iconSize={iconSize} />
          <Swatch theme={theme.name} iconSize={iconSize} />
          <Swatch theme={theme.name} iconSize={iconSize} />
          <Swatch theme={theme.name} iconSize={iconSize} />
          <Swatch theme={theme.name} iconSize={iconSize} />
          <Swatch theme={theme.name} iconSize={iconSize} />
          <Swatch theme={theme.name} iconSize={iconSize} />
          <Swatch theme={theme.name} iconSize={iconSize} />
          <Swatch theme={theme.name} iconSize={iconSize} />
          <Swatch theme={theme.name} iconSize={iconSize} />
          <Swatch theme={theme.name} iconSize={iconSize} />
          <Swatch theme={theme.name} iconSize={iconSize} />
        </div>
      </div>
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <Toolbar
        theme={theme.name}
        percent={percent}
        onChange={(e) => {
          const p = Num.Percent.clamp(e.percent);
          const px = Math.round(Num.Percent.Range.fromPercent(p, [MIN, MAX]));
          props.onSizeChange?.({ percent: p, pixels: px });
        }}
      />
      {elBody}
    </div>
  );
};
