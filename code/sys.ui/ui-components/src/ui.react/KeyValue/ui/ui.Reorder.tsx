import React from 'react';
import { css, Reorder as ReorderBase, type t } from '../common.ts';
import { toNavigationRootProps } from '../m.Focus/u.navigation.ts';
import { type Boundary as FocusBoundary } from '../m.Focus/u.render.ts';
import { type ReorderModel, sameIds, toReorderChange, toReorderedItems } from '../u/mod.ts';
import { itemShellClass } from './ui.ItemShell.tsx';

type P = {
  dataComponent: string;
  layout: t.KeyValue.Layout;
  model: ReorderModel;
  style?: t.CssInput;
  onStart?: t.KeyValue.Reorder.StartHandler;
  onChange: t.KeyValue.Reorder.ChangeHandler;
  onEnd?: t.KeyValue.Reorder.EndHandler;
  focusNavigation?: React.KeyboardEventHandler<HTMLElement>;
  focusActiveFill: t.RgbaColor;
  focusBoundary?: (item: t.KeyValue.Item) => FocusBoundary | undefined;
  renderItem: (item: t.KeyValue.Item) => t.ReactNode;
};

type ItemId = string;
type ItemIds = readonly ItemId[];
type DragHandler = (id: ItemId) => void;
type MotionReorderHandler = (nextIds: ItemId[]) => void;

/**
 * Internal Motion-backed KeyValue reorder list.
 */
export const ReorderList: React.FC<P> = (props) => {
  const { dataComponent, layout, model, onChange, onEnd, onStart, renderItem } = props;
  const startIdsRef = React.useRef<ItemIds | undefined>(undefined);
  const currentIdsRef = React.useRef<ItemIds | undefined>(undefined);

  const itemRef = (id: ItemId, ids: ItemIds): t.KeyValue.Reorder.ItemRef | undefined => {
    const index = ids.indexOf(id);
    const item = model.byId.get(id);
    if (!item || index < 0) return;
    return { id, item, index };
  };

  const onDragStart: DragHandler = (id) => {
    startIdsRef.current = [...model.ids];
    currentIdsRef.current = [...model.ids];
    const active = itemRef(id, model.ids);
    if (active) onStart?.({ active, items: [...model.items] });
  };

  const onDragEnd: DragHandler = (id) => {
    const currentIds = currentIdsRef.current ?? model.ids;
    const active = itemRef(id, currentIds);
    const startIds = startIdsRef.current;
    const changed = startIds ? !sameIds(startIds, currentIds) : false;
    const items = toReorderedItems(currentIds, model.byId) ?? [...model.items];

    startIdsRef.current = undefined;
    currentIdsRef.current = undefined;
    if (active) onEnd?.({ active, items, changed });
  };

  const onReorder: MotionReorderHandler = (nextIds) => {
    const previousIds = currentIdsRef.current ?? model.ids;
    const change = toReorderChange({ nextIds, previousIds, byId: model.byId });
    if (!change) return;

    currentIdsRef.current = change.ids;
    if (!change.changed) return;

    onChange({ next: change.next });
  };

  const elItems = model.ids.map((id) => {
    const item = model.byId.get(id);
    if (!item) return null;
    const focus = props.focusBoundary?.(item);
    return (
      <ReorderBase.Item
        as='div'
        key={id}
        value={id}
        className={itemShellClass(item, layout, focus?.active, props.focusActiveFill)}
        data-keyvalue-item-boundary={focus ? 'true' : undefined}
        data-keyvalue-focus-path={focus?.encodedPath}
        data-keyvalue-focus-active={focus?.active ? 'true' : undefined}
        onClick={focus?.onClick}
        onDragStart={() => onDragStart(id)}
        onDragEnd={() => onDragEnd(id)}
      >
        {renderItem(item)}
      </ReorderBase.Item>
    );
  });

  return (
    <ReorderBase.Group
      as='div'
      axis='y'
      values={model.ids}
      onReorder={onReorder}
      className={css(props.style).class}
      data-component={dataComponent}
      {...toNavigationRootProps(props.focusNavigation)}
    >
      {elItems}
    </ReorderBase.Group>
  );
};
