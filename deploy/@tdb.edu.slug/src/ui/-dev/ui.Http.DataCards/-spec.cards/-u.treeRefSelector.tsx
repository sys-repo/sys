import React from 'react';
import { type t, BulletList, Is, Num, Str } from './common.ts';

type Props = {
  selected?: string;
  refs?: string[];
  totalVisible?: number | 'all';
  onSelect?: (next: string) => void;
};

export function renderTreeRefSelector<TParams extends Record<string, unknown>>(
  e: t.ActionProbe.ProbeRenderArgs<t.TEnv, TParams>,
  props: Props,
) {
  const refs = props.refs ?? [];
  const visible = toVisible(props.totalVisible);
  const rows = toRows(refs, visible);

  e.element(<BulletList.UI selected={props.selected} items={rows} onSelect={(ev) => props.onSelect?.(ev.id)} />);
}

function toRows(refs: string[], visible: number | null): t.BulletList.Item[] {
  if (visible === null || refs.length <= visible) return toBulletItems(refs);

  const head = refs.slice(0, visible);
  const last = refs[refs.length - 1];
  const items = toBulletItems(head);
  items.push({
    kind: 'content',
    key: '__omitted__',
    render: () => <span style={{ userSelect: 'none' }}>{'..'}</span>,
  });
  if (!head.includes(last)) {
    items.push(toBulletItem(last, refs.length - 1));
  }
  return items;
}

function toBulletItems(refs: string[]): t.BulletList.Item[] {
  return refs.map((id, index) => toBulletItem(id, index));
}

function toBulletItem(id: string, index: number): t.BulletList.Item {
  const label = <span>{`${index + 1}. ${Str.ellipsize(id, [22, 8], '..')}`}</span>;
  return { id, label };
}

function toVisible(value: number | 'all' | undefined): number | null {
  if (value === 'all') return null;
  if (!Is.number(value)) return 3;
  const rounded = Num.round(value);
  return Num.clamp(1, Num.MAX_INT, rounded);
}
