import React from 'react';
import { type t, Color, css, D } from './common.ts';
import { toFont, toRowOpacity, toSpacing } from './u.ts';
import { Cell } from './ui.Cell.tsx';

type P = Omit<t.KeyValueItemProps, 'layout' | 'item'> & {
  layout: t.KeyValueLayoutSpaced;
  item: t.KeyValueRow;
};

export const RowSpaced: React.FC<P> = (props) => {
  const { debug = false, item, mono, truncate, layout } = props;
  const opacity = toRowOpacity(item.opacity, { k: D.keyOpacity, v: 1 });

  /**
   * Render:
   */
  const theme = Color.theme(props.theme);
  const keyTrack = truncate ? 'fit-content(24ch)' : 'auto';
  const valueTrack = truncate ? '1fr' : 'minmax(16ch, 1fr)';
  const spacing = toSpacing(item.x, item.y);
  const { fontFamily } = toFont({ mono });
  const styles = {
    base: css({
      Margin: spacing.edges,
      display: 'grid',
      gridTemplateColumns: `${keyTrack} ${valueTrack}`,
      columnGap: layout.columnGap ?? 12,
      alignItems: layout.align ?? D.layout.spaced.align,
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      fontFamily,
    }),
  };

  return (
    <div className={css(styles.base, props.style).class}>
      <Cell
        role={'key'}
        layout={layout}
        theme={theme.name}
        debug={debug}
        mono={mono}
        truncate={truncate}
        size={props.size}
        opacity={opacity.k}
        children={item.k}
      />
      <Cell
        role={'val'}
        layout={layout}
        theme={theme.name}
        debug={debug}
        style={{ textAlign: truncate ? 'right' : 'left' }}
        mono={mono}
        truncate={truncate}
        userSelect={item.userSelect}
        size={props.size}
        opacity={opacity.v}
        children={item.v}
      />
    </div>
  );
};
