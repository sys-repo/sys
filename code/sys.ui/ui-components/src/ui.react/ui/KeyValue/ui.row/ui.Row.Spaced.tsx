import React from 'react';
import { type t, Color, css, D } from '../common.ts';
import { toFont, toRowOpacity, toSpacing } from '../u/mod.ts';
import { Cell } from '../ui/ui.Cell.tsx';
import { toCellCursor, type CursorRender } from './u.cursor.ts';

type P = Omit<t.KeyValue.ItemProps, 'layout' | 'item'> & {
  layout: t.KeyValue.Layout.Spaced;
  item: t.KeyValue.Item.Row;
  cursor?: CursorRender;
};

export const RowSpaced: React.FC<P> = (props) => {
  const { debug = false, item, mono, truncate, layout } = props;
  const opacity = toRowOpacity(item.opacity, { k: D.keyOpacity, v: 1 });
  const cursorPart = props.cursor?.part;

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
        enabled={props.enabled}
        disabledOpacity={props.disabledOpacity}
        truncate={truncate}
        size={props.size}
        href={item.href}
        opacity={opacity.k}
        cursor={toCellCursor(cursorPart, 'key')}
        children={item.k}
      />
      <Cell
        role={'val'}
        layout={layout}
        theme={theme.name}
        debug={debug}
        style={{ textAlign: truncate ? 'right' : 'left' }}
        mono={mono}
        enabled={props.enabled}
        disabledOpacity={props.disabledOpacity}
        truncate={truncate}
        userSelect={item.userSelect}
        size={props.size}
        href={item.href}
        opacity={opacity.v}
        cursor={toCellCursor(cursorPart, 'value')}
        children={item.v}
      />
    </div>
  );
};
