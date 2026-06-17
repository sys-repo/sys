import { type t } from './common.ts';
import { SwitchValue } from './ui.Switch.tsx';

/** Convert one switch input into a KeyValue row. */
export const toItem: t.KeyValueSwitches.ToItem = (item, options = {}) => {
  const index = options.index ?? 0;
  return {
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
  };
};

/** Convert switch inputs into KeyValue items. */
export const toItems: t.KeyValueSwitches.ToItems = (items = [], options = {}) => {
  return items.map((item, index) => toItem(item, { ...options, index }));
};
