import React from 'react';
import { css, D, Motion, type t } from '../common.ts';
import { type Boundary as FocusBoundary } from '../m.Focus/u.render.ts';
import { type ProjectionAnimationModel, toLayout } from '../u/mod.ts';

type P = {
  item: t.KeyValue.Item;
  layout?: t.KeyValue.Layout;
  focus?: FocusBoundary;
  children?: t.ReactNode;
};

type ProjectionP = P & {
  projection: ProjectionAnimationModel;
};

/**
 * CSS class for the internal per-item KeyValue boundary.
 */
export function itemShellClass(item: t.KeyValue.Item, layout?: t.KeyValue.Layout, active?: boolean) {
  const resolved = toLayout(layout);
  const kind = item.kind ?? 'row';
  const isRow = kind === 'row';
  const isGroup = kind === 'group';
  const isTable = resolved.kind === 'table';
  const usesSubgrid = isTable && (isRow || isGroup);
  const isRecursiveShell = isGroup;

  /**
   * Table rows and groups use a column subgrid so cells keep participating in
   * the parent KeyValue table tracks while the item itself has a real DOM box.
   */
  return css({
    position: 'relative',
    boxSizing: 'border-box',
    minWidth: 0,
    display: usesSubgrid || isRecursiveShell ? 'grid' : 'flow-root',
    gridColumn: isTable ? '1 / -1' : undefined,
    gridTemplateColumns: usesSubgrid ? 'subgrid' : undefined,
    rowGap: isRecursiveShell ? (resolved.rowGap ?? D.layout.spaced.rowGap) : undefined,
    backgroundColor: active ? 'rgba(255, 0, 0, 0.1)' /* RED */ : undefined,
  }).class;
}

/**
 * Internal per-item boundary for KeyValue render items.
 */
export const ItemShell: React.FC<P> = (props) => {
  return (
    <div
      className={itemShellClass(props.item, props.layout, props.focus?.active)}
      data-keyvalue-item-boundary={props.focus ? 'true' : undefined}
      data-keyvalue-focus-path={props.focus?.encodedPath}
      data-keyvalue-focus-active={props.focus?.active ? 'true' : undefined}
      onClick={props.focus?.onClick}
    >
      {props.children}
    </div>
  );
};

/**
 * Motion-backed direct-child shell for opt-in layout projection animation.
 */
export const ProjectionItemShell: React.FC<ProjectionP> = (props) => {
  return (
    <Motion.div
      layout='position'
      transition={props.projection.transition}
      className={itemShellClass(props.item, props.layout, props.focus?.active)}
      data-keyvalue-projection='direct-child'
      data-keyvalue-item-boundary={props.focus ? 'true' : undefined}
      data-keyvalue-focus-path={props.focus?.encodedPath}
      data-keyvalue-focus-active={props.focus?.active ? 'true' : undefined}
      onClick={props.focus?.onClick}
    >
      {props.children}
    </Motion.div>
  );
};
