import React from 'react';
import { css, Reorder as ReorderBase, type t } from './common.ts';
import { type ReorderModel, sameIds, toReorderedItems } from './u.reorder.ts';
import { itemShellClass } from './ui.ItemShell.tsx';

type P = {
  dataComponent: string;
  layout: t.KeyValue.Layout;
  model: ReorderModel;
  style?: t.CssInput;
  onChange: t.KeyValue.Reorder.Handler;
  renderItem: (item: t.KeyValue.Item) => t.ReactNode;
};

type OnReorder = (nextIds: string[]) => void;

/**
 * Internal Motion-backed KeyValue reorder list.
 */
export const ReorderList: React.FC<P> = (props) => {
  const { dataComponent, layout, model, onChange, renderItem } = props;

  const onReorder: OnReorder = (nextIds) => {
    if (sameIds(nextIds, model.ids)) return;
    const next = toReorderedItems(nextIds, model.byId);
    if (next) onChange({ next });
  };

  const elItems = model.ids.map((id) => {
    const item = model.byId.get(id);
    if (!item) return null;
    return (
      <ReorderBase.Item as='div' key={id} value={id} className={itemShellClass(item, layout)}>
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
