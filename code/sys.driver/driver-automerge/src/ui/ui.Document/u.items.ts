import { type t, Is, Obj, PATH, Str, Time } from './common.ts';

export function toItems(doc?: t.Crdt.Ref, stats?: t.DocumentStats): t.KeyValueItem[] {
  const items: t.KeyValueItem[] = [];
  if (!doc) return items;

  const x = [10, 0] as const;
  items.push({ kind: 'title', v: 'CRDT Document', y: [0, 10] });

  if (doc) {
    const meta = Obj.Lens.bind<t.SysMeta>(doc.current, PATH.meta);
    const { createdAt } = meta.get() ?? {};

    items.push({ k: 'Identity' });
    items.push({ k: 'Document', v: `crdt:${doc.id}`, x });
    items.push({ k: 'Handle', v: `instance-${doc.instance}`, x });
    if (Is.num(createdAt)) {
      const elapsed = Time.elapsed(createdAt);
      items.push({ k: 'Created', v: `${elapsed.toString()} ago`, x });
    }
  }

  if (stats) {
    items.push({ kind: 'hr' });
    items.push({ k: 'Metrics' });
    items.push({ k: 'Serialized size', v: `${Str.bytes(stats.bytes)}`, x });
    items.push({ k: 'Changes', v: stats.total.changes.toLocaleString(), x });
    items.push({ k: 'Operations', v: stats.total.ops.toLocaleString(), x });
  }

  return items;
}
