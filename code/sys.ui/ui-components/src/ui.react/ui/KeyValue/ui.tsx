import React from 'react';

import { Color, css, D, type t } from './common.ts';
import { toCssSize, toFont, toLayout, toProjectionAnimation, toReorderModel } from './u/mod.ts';
import { useCursorArrivalCue } from './m.Cursor/u/use.arrival.ts';
import { applyCursorFill, isCursorRootFocused } from './m.Cursor/u/u.affordance.ts';
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
  const cursorCurrentFillBlurred = Color.alpha(theme.fg, 0.04);
  const cursorCurrentFillFocused = Color.alpha(theme.fg, theme.is.light ? 0.06 : 0.075);
  const cursorPartFillBlurred = Color.ruby(0.12);
  const cursorPartFillFocused = Color.ruby(0.24);
  const cursorArrival = useCursorArrivalCue({ items, cursor: props.cursor, fg: theme.fg });
  const { fontSize, fontFamily } = toFont(props);

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
  const cursorRootRef = React.useRef<HTMLDivElement | null>(null);
  const rootFocused = isCursorRootFocused(cursorRootRef.current);
  const cursorCurrentFill = rootFocused ? cursorCurrentFillFocused : cursorCurrentFillBlurred;
  const cursorPartFill = rootFocused ? cursorPartFillFocused : cursorPartFillBlurred;
  const cursorRootFocusHandlers = {
    onFocus: (event: React.FocusEvent<HTMLElement>) => {
      if (event.currentTarget !== event.target) return;
      applyCursorFill(event.currentTarget, {
        current: cursorCurrentFillFocused,
        part: cursorPartFillFocused,
      });
    },
    onBlur: (event: React.FocusEvent<HTMLElement>) => {
      if (event.currentTarget !== event.target) return;
      applyCursorFill(event.currentTarget, {
        current: cursorCurrentFillBlurred,
        part: cursorPartFillBlurred,
      });
    },
  };
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
    cursorArrival,
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
        cursorRootRef={cursorRootRef}
        cursorCurrentFill={cursorCurrentFill}
        cursorArrival={cursorArrival}
        cursorBoundary={(item) => toCursorBoundary(item, renderContext, [])}
        cursorRootFocusHandlers={cursorRootFocusHandlers}
        renderItem={(item, cursor) => renderRootItem(item, renderContext, cursor)}
      />
    );
  }

  const elRows = renderItems(items, renderContext);

  return (
    <div
      ref={cursorRootRef}
      className={className}
      data-component={D.displayName}
      {...toNavigationRootProps(cursorNavigation)}
      {...cursorRootFocusHandlers}
    >
      {elRows}
    </div>
  );
};
