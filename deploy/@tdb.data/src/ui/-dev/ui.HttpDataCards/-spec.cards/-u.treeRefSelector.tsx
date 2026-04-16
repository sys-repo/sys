import React from 'react';
import { type t, BulletList, Is, Num, Str } from './common.ts';

type O = Record<string, unknown>;

type Props = {
  selected?: string;
  refs?: string[];
  ensureRefs?: string[];
  totalVisible?: number | 'all';
  onSelect?: (next: string) => void;
};

export function renderTreeRefSelector<TParams extends O>(
  e: t.ActionProbe.ProbeRenderArgs<t.HttpDataCards.TEnv, TParams>,
  props: Props,
) {
  const refs = props.refs ?? [];
  const visible = toVisible(props.totalVisible);
  const rows = toRows(refs, props.ensureRefs ?? [], visible);

  e.element(
    <BulletList.UI selected={props.selected} items={rows} onSelect={(ev) => props.onSelect?.(ev.id)} />
  );
}

function toRows(refs: string[], ensureRefs: string[], visible: number | null): t.BulletList.Item[] {
  if (visible === null || refs.length <= visible) return toBulletItems(refs, refs);

  const index = new Set(refs);
  const ensured: string[] = [];
  const ensuredSet = new Set<string>();
  for (const id of ensureRefs) {
    if (!index.has(id)) continue;
    if (ensuredSet.has(id)) continue;
    ensuredSet.add(id);
    ensured.push(id);
  }

  const visibleIds: string[] = refs.slice(0, visible);
  const visibleSet = new Set(visibleIds);
  for (const id of ensured) {
    if (visibleSet.has(id)) continue;
    visibleSet.add(id);
    visibleIds.push(id);
  }

  const items = toBulletItems(visibleIds, refs);
  const last = refs[refs.length - 1];
  const hidden = refs.some((id) => !visibleSet.has(id));
  if (hidden) {
    items.push({
      kind: 'content',
      key: '__omitted__',
      render: () => <span style={{ userSelect: 'none' }}>{'..'}</span>,
    });
  }
  if (last && !visibleSet.has(last)) {
    items.push(toBulletItem(last, refs));
  }
  return items;
}

function toBulletItems(ids: string[], refs: string[]): t.BulletList.Item[] {
  return ids.map((id) => toBulletItem(id, refs));
}

function toBulletItem(id: string, refs: string[]): t.BulletList.Item {
  const index = refs.indexOf(id);
  const label = <span>{`${index + 1}. ${Str.ellipsize(id, [22, 8], '..')}`}</span>;
  return { id, label };
}

function toVisible(value: number | 'all' | undefined): number | null {
  if (value === 'all') return null;
  if (!Is.number(value)) return 3;
  const rounded = Num.round(value);
  return Num.clamp(1, Num.MAX_INT, rounded);
}
