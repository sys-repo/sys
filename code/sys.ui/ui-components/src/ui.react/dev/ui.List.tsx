import type { t } from './common.ts';
import { BulletList } from '../ui/BulletList/mod.ts';

/**
 * Bind row methods to the production list without owning selection or interaction state.
 */
export const DevList = <Id extends string = string>(props: t.Dev.List.Props<Id>) => {
  const { items, selected, size = 'sm', itemPadding = [0, 8, 0, 5] } = props;
  return (
    <BulletList.UI
      items={items.map(({ id, label, enabled }) => ({ id, label, enabled }))}
      selected={selected}
      size={size}
      itemPadding={itemPadding}
      columns={props.columns}
      theme={props.theme}
      style={props.style}
      onActivate={(e) => items.find((item) => item.id === e.id)?.onActivate(e)}
    />
  );
};
