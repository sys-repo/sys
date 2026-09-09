import { describe, expect, Is, it, type t } from '../../../-test.ts';
import { Cursor } from '../m.Cursor/mod.ts';

type Item = t.KeyValue.Item;

const target = (...path: string[]): t.KeyValue.Cursor.Target => Cursor.target(path);
const hr = (items: readonly Item[]): Item => ({ id: nextHrId(items), kind: 'hr' });

describe('KeyValue.Cursor insertion', () => {
  it('inserts an item after the current root cursor target', () => {
    const items: Item[] = [
      { id: 'alpha', k: 'alpha' },
      { id: 'bravo', k: 'bravo' },
    ];

    const change = Cursor.insertAfter({
      items,
      current: target('alpha'),
      createItem: ({ items }) => hr(items),
    });

    expect(change?.index).to.eql(1);
    expect(change?.scope).to.eql([]);
    expect(change?.next).to.eql([
      { id: 'alpha', k: 'alpha' },
      { id: 'inserted:hr:1', kind: 'hr' },
      { id: 'bravo', k: 'bravo' },
    ]);
  });

  it('inserts inside the current nested sibling scope', () => {
    const items: Item[] = [
      {
        id: 'group',
        kind: 'group',
        items: [{ id: 'child', k: 'child' }, { id: 'omega', k: 'omega' }],
      },
      { id: 'tail', k: 'tail' },
    ];

    const change = Cursor.insertAfter({
      items,
      current: target('group', 'child'),
      createItem: ({ items }) => hr(items),
    });

    expect(change?.index).to.eql(1);
    expect(change?.scope).to.eql(['group']);
    expect(change?.next).to.eql([
      {
        id: 'group',
        kind: 'group',
        items: [
          { id: 'child', k: 'child' },
          { id: 'inserted:hr:1', kind: 'hr' },
          { id: 'omega', k: 'omega' },
        ],
      },
      { id: 'tail', k: 'tail' },
    ]);
  });

  it('inserts after a group atom from its parent scope', () => {
    const items: Item[] = [
      { id: 'alpha', k: 'alpha' },
      { id: 'group', kind: 'group', items: [{ id: 'child', k: 'child' }] },
      { id: 'tail', k: 'tail' },
    ];

    const change = Cursor.insertAfter({
      items,
      current: target('group'),
      createItem: ({ items }) => hr(items),
    });

    expect(change?.scope).to.eql([]);
    expect(change?.next.map((item) => item.id)).to.eql(['alpha', 'group', 'inserted:hr:1', 'tail']);
  });

  it('passes root items to createItem so hosts can avoid used IDs', () => {
    const items: Item[] = [
      { id: 'alpha', k: 'alpha' },
      {
        id: 'group',
        kind: 'group',
        items: [{ id: 'inserted:hr:1', kind: 'hr' }],
      },
    ];

    const change = Cursor.insertAfter({
      items,
      current: target('alpha'),
      createItem: ({ items }) => hr(items),
    });

    expect(change?.item).to.eql({ id: 'inserted:hr:2', kind: 'hr' });
    expect(nextHrId(change?.next ?? [])).to.eql('inserted:hr:3');
  });

  it('does not insert without a resolvable current cursor target', () => {
    const items: Item[] = [
      { id: 'alpha', k: 'alpha' },
      { id: 'duplicate', k: 'duplicate:a' },
      { id: 'duplicate', k: 'duplicate:b' },
    ];

    expect(Cursor.insertAfter({ items, createItem: { id: 'hr', kind: 'hr' } })).to.eql(undefined);
    expect(
      Cursor.insertAfter({
        items,
        current: target('missing'),
        createItem: { id: 'hr', kind: 'hr' },
      }),
    ).to.eql(undefined);
    expect(
      Cursor.insertAfter({
        items,
        current: target('duplicate'),
        createItem: { id: 'hr', kind: 'hr' },
      }),
    ).to.eql(undefined);
  });
});

function nextHrId(items: readonly Item[]) {
  const existing = new Set(flatIds(items));

  let index = 1;
  while (existing.has(`inserted:hr:${index}`)) index += 1;
  return `inserted:hr:${index}`;
}

function flatIds(items: readonly Item[]): string[] {
  return items.flatMap((item) => {
    const id = Is.string(item.id) && !Is.blank(item.id) ? [item.id] : [];
    return item.kind === 'group' ? [...id, ...flatIds(item.items)] : id;
  });
}
