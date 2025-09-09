import React from 'react';

import { type t, Color, css, D, Obj } from './common.ts';
import { Size } from './u.Size.ts';
import { Swatch } from './ui.Swatch.tsx';
import { Toolbar } from './ui.Toolbar.tsx';

export const IconSwatches: React.FC<t.IconSwatchesProps> = (props) => {
  const { debug = false, percent = D.percent, items = [], selected } = props;

  // Slider → percent → cell size:
  const MIN = props.minSize ?? D.minSize; //   ← px, smallest cell
  const MAX = props.maxSize ?? D.maxSize; //   ← px, largest cell
  const range = [MIN, MAX] as const;

  const PAD = D.Swatch.pad;
  const FOOT = D.Swatch.footerHeight;
  const CHROME = PAD * 2 + FOOT;

  const cell = Math.max(MIN, Math.round(MIN + (MAX - MIN) * percent)); // ← px (layout unit)
  const iconSize = Math.max(16, cell - CHROME); //                        ← fit available square area

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
        gridTemplateColumns: `repeat(auto-fit, minmax(${cell}px, 1fr))`,
        alignContent: 'start',
        gap: 25,
      }),
    },
  };

  const elBody = (
    <div className={styles.body.base.class}>
      <div className={styles.body.inner.class}>
        <div className={styles.body.layout.class}>
          {items.map(([path, renderer], i) => {
            return (
              <Swatch
                key={`${i}.${path}`}
                theme={theme.name}
                iconSize={iconSize}
                path={path}
                icon={renderer}
                selected={Obj.Path.eql(path, selected)}
                onSelect={props.onSelect}
              />
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className={css(styles.base, props.style).class}>
      <Toolbar
        theme={theme.name}
        percent={percent}
        iconSize={iconSize}
        onChange={(e) => {
          const { percent, pixels } = Size.normalize(e.percent, range);
          props.onSizeChange?.({ percent, pixels });
        }}
      />
      {elBody}
    </div>
  );
};
