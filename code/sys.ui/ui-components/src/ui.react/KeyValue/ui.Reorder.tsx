import React from 'react';
import { css, Reorder as ReorderBase, type t } from './common.ts';
import { type ReorderModel, sameIds, toReorderedItems } from './u.reorder.ts';
import { itemShellClass } from './ui.ItemShell.tsx';

type P = {
  dataComponent: string;
  layout: t.KeyValue.Layout;
  model: ReorderModel;
  style?: t.CssInput;
  onStart?: t.KeyValue.Reorder.StartHandler;
  onChange: t.KeyValue.Reorder.ChangeHandler;
  onEnd?: t.KeyValue.Reorder.EndHandler;
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
    startIdsRef.current = model.ids;
    currentIdsRef.current = model.ids;
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
    if (sameIds(nextIds, model.ids)) return;
    const next = toReorderedItems(nextIds, model.byId);
    if (!next) return;
    currentIdsRef.current = nextIds;
    onChange({ next });
  };

  const elItems = model.ids.map((id) => {
    const item = model.byId.get(id);
    if (!item) return null;
    return (
      <ReorderBase.Item
        as='div'
        key={id}
        value={id}
        className={itemShellClass(item, layout)}
        onDragStart={onStart || onEnd ? () => onDragStart(id) : undefined}
        onDragEnd={onStart || onEnd ? () => onDragEnd(id) : undefined}
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
    >
      {elItems}
    </ReorderBase.Group>
  );
};
