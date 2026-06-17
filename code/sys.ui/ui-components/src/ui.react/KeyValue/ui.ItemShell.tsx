import React from 'react';
import { type t, css } from './common.ts';
import { toLayout } from './u.ts';

type P = {
  item: t.KeyValue.Item;
  layout?: t.KeyValue.Layout;
  children?: t.ReactNode;
};

/** Internal per-item boundary for KeyValue render items. */
export const ItemShell: React.FC<P> = (props) => {
  const { item } = props;
  const layout = toLayout(props.layout);
  const kind = item.kind ?? 'row';
  const isRow = kind === 'row';
  const isTable = layout.kind === 'table';

  /**
   * Table rows use a column subgrid so cells keep participating in the
   * parent KeyValue table tracks while the item itself has a real DOM box.
   */
  const styles = {
    base: css({
      position: 'relative',
      boxSizing: 'border-box',
      minWidth: 0,
      display: isTable && isRow ? 'grid' : 'flow-root',
      gridColumn: isTable ? '1 / -1' : undefined,
      gridTemplateColumns: isTable && isRow ? 'subgrid' : undefined,
    }),
  };

  return <div className={styles.base.class}>{props.children}</div>;
};
