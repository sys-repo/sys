import React from 'react';

import { Color, css, D, Obj, type t } from './common.ts';
import { toCssSize, toFont, toLayout, toProjectionAnimation, toReorderModel } from './u/mod.ts';
import { Cursor } from './m.Cursor/mod.ts';
import { toNavigationHandler, toNavigationRootProps } from './m.Cursor/u/u.navigation.ts';
import {
  type RenderContext,
  renderItems,
  renderRootItem,
  toCursorBoundary,
} from './ui.item/mod.ts';
import { ReorderList } from './ui/mod.ts';

export const KeyValue: React.FC<t.KeyValue.Props> = (props) => {
  const { debug = false, items = [], size = D.size, mono = D.mono, truncate = D.truncate } = props;
  const enabled = props.enabled ?? D.enabled;
  const disabledOpacity = props.defaults?.disabledOpacity ?? D.defaults.disabledOpacity;
  const layout = toLayout(props.layout);
  const theme = Color.theme(props.theme);
  const cursorCurrentFill = Color.alpha(theme.fg, 0.06);
  const cursorArrivalFill = Color.alpha(theme.fg, 0.14);
  const cursorPartFill = Color.ruby(0.2);
  const cursorAdoptedRef = React.useRef(false);
  const cursorCurrentKey = toCursorCurrentKey(items, props.cursor);
  const cursorArrivalKey = cursorAdoptedRef.current ? undefined : cursorCurrentKey;
  const { fontSize, fontFamily } = toFont(props);

  React.useEffect(() => {
    if (cursorCurrentKey) cursorAdoptedRef.current = true;
  }, [cursorCurrentKey]);

  const isTable = layout.kind === 'table';
  const keyTrack = isTable && layout.keyMax
    ? `fit-content(${toCssSize(layout.keyMax)})`
    : 'max-content';

  const styles = {
    base: css({
      position: 'relative',
      userSelect: 'none',
      boxSizing: 'border-box',
      backgroundColor: Color.ruby(debug),
      color: theme.fg,
      fontSize,
      fontFamily,
      lineHeight: 1.35,
      outline: 'none',
      ':focus': { outline: 'none' },
      ':focus-visible': { outline: 'none' },

      // Switch container model:
      display: 'grid',
      gridTemplateColumns: isTable ? `${keyTrack} 1fr` : undefined,
      columnGap: isTable ? (layout.columnGap ?? 12) : undefined,
      rowGap: layout.rowGap ?? 4,
    }),
  };

  const style = css(styles.base, props.style);
  const className = style.class;
  const reorder = props.reorder;
  const onReorderChange = reorder?.onChange;
  const reorderModel = reorder && reorder.enabled !== false && onReorderChange
    ? toReorderModel(items, reorder)
    : undefined;

  /** Motion Reorder owns item motion while active; projection is the static path only. */
  const projection = reorderModel ? undefined : toProjectionAnimation(props.animation, items);
  const cursorNavigation = toNavigationHandler({ items, cursor: props.cursor });
  const renderContext: RenderContext = {
    theme: theme.name,
    enabled,
    disabledOpacity,
    mono,
    truncate,
    layout,
    rootItems: items,
    cursor: props.cursor,
    cursorCurrentFill,
    cursorArrivalFill,
    cursorArrivalKey,
    cursorPartFill,
    size,
    debug,
    projection,
  };

  if (reorderModel && onReorderChange) {
    return (
      <ReorderList
        style={style}
        dataComponent={D.displayName}
        layout={layout}
        model={reorderModel}
        onStart={reorder.onStart}
        onChange={onReorderChange}
        onEnd={reorder.onEnd}
        cursorNavigation={cursorNavigation}
        cursorCurrentFill={cursorCurrentFill}
        cursorArrivalFill={cursorArrivalFill}
        cursorArrivalKey={cursorArrivalKey}
        cursorBoundary={(item) => toCursorBoundary(item, renderContext, [])}
        renderItem={(item, cursor) => renderRootItem(item, renderContext, cursor)}
      />
    );
  }

  const elRows = renderItems(items, renderContext);

  return (
    <div
      className={className}
      data-component={D.displayName}
      {...toNavigationRootProps(cursorNavigation)}
    >
      {elRows}
    </div>
  );
};

function toCursorCurrentKey(
  items: readonly t.KeyValue.Item[],
  cursor?: t.KeyValue.Cursor.Props,
): string | undefined {
  if (!cursor || cursor.enabled === false) return undefined;
  const current = cursor.model?.current;
  if (!current) return undefined;
  const resolved = Cursor.set({}, items, current).current;
  if (!resolved) return undefined;
  return `${Obj.Path.encode(resolved.path)}:${resolved.part ?? 'atom'}`;
}
