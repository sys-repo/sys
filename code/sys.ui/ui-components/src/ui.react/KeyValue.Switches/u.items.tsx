import { Is, type t } from './common.ts';
import { SwitchValue } from './ui.Switch.tsx';

const isHr = (item: t.KeyValueSwitches.Item): item is t.KeyValue.Hr => {
  return Is.object(item) && 'kind' in item && item.kind === 'hr';
};

const isGroup = (item: t.KeyValueSwitches.Item): item is t.KeyValueSwitches.Group => {
  return Is.object(item) && 'kind' in item && item.kind === 'group';
};

/** Convert one switch input into a KeyValue row. */
export const toItem: t.KeyValueSwitches.ToItem = (item, options = {}) => {
  const index = options.index ?? 0;
  return {
    id: item.id,
    kind: 'row',
    k: item.label ?? item.id,
    v: (
      <SwitchValue
        item={item}
        index={index}
        enabled={options.enabled}
        theme={options.theme}
        switch={options.switch}
      />
    ),
    opacity: item.opacity,
  };
};

/** Convert switch inputs into KeyValue items. */
export const toItems: t.KeyValueSwitches.ToItems = (items = [], options = {}) => {
  return items.map((item, index) => {
    if (isHr(item)) return item;
    if (isGroup(item)) return { id: item.id, kind: 'group', items: toItems(item.items, options) };
    return toItem(item, { ...options, index });
  });
};
