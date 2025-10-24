import React from 'react';

import { type t, Color, css, D } from './common.ts';
import { toFont, toSpacing } from './u.ts';
import { Cell } from './ui.Cell.tsx';

type P = Omit<t.KeyValueItemProps, 'layout' | 'item'> & {
  layout: t.KeyValueLayoutSpaced;
  item: t.KeyValueRow;
};

export const RowSpaced: React.FC<P> = (props) => {
  const { debug = false, item, mono, truncate, layout } = props;

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
        theme={theme.name}
        debug={debug}
        style={{ textAlign: 'left' }}
        mono={mono}
        truncate={truncate}
        size={props.size}
        children={item.k}
      />
      <Cell
        role={'val'}
        theme={theme.name}
        debug={debug}
        style={{ textAlign: truncate ? 'right' : 'left' }}
        mono={mono}
        truncate={truncate}
        size={props.size}
        children={item.v}
      />
    </div>
  );
};
