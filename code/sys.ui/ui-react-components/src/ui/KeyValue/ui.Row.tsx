import React from 'react';

import { type t } from './common.ts';
import { toLayout } from './u.ts';
import { RowSpaced } from './ui.Row.Spaced.tsx';
import { RowTable } from './ui.Row.Table.tsx';

type P = t.KeyValueItemProps;

export const Row: React.FC<P> = (props) => {
  const { item } = props;
  if (item.kind != null && item.kind !== 'row') return null;

  const layout = toLayout(props.layout);
  const row = item as t.KeyValueRow;

  if (layout.kind === 'table') return <RowTable {...props} layout={layout} item={row} />;
  if (layout.kind === 'spaced') return <RowSpaced {...props} layout={layout} item={row} />;

  return null;
};
