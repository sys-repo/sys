import { describe, expect, it, type t } from '../../../-test.ts';
import { Cursor } from '../m.Cursor/mod.ts';
import { blockTarget, toBlocks } from '../m.Cursor/u/u.block.ts';

type Item = t.KeyValue.Item;

const target = (...path: t.ObjectPath): t.KeyValue.Cursor.Target => Cursor.target(path);

function row(id: string): Item {
  return { id, k: id, v: id };
}

function scope(items: Item[], path: t.ObjectPath = []) {
  return Cursor.scope(items, path);
}

function current(items: Item[], cursorTarget: t.KeyValue.Cursor.Target) {
  const item = scope(items, cursorTarget.path.slice(0, -1)).items.find((item) =>
    Cursor.eql(item.target, Cursor.target(cursorTarget.path))
  );
  if (!item) throw new Error(`missing cursor item: ${cursorTarget.path.join('.')}`);
  return item;
}

describe('KeyValue.Cursor/u.block', () => {
  it('derives direct-sibling hr-delimited blocks', () => {
    const items: Item[] = [
      row('alpha'),
      { kind: 'hr' },
      row('bravo'),
      row('charlie'),
      { kind: 'hr' },
      { id: 'title', kind: 'title', v: 'Title' },
      row('delta'),
    ];

    const blocks = toBlocks(items, scope(items).items);

    expect(blocks.map((block) => [block.start, block.end])).to.eql([[0, 0], [2, 3], [5, 6]]);
    expect(blocks.map((block) => block.targets.map((item) => item.id))).to.eql([
      ['alpha'],
      ['bravo', 'charlie'],
      ['title', 'delta'],
    ]);
  });

  it('steps to current block edges before crossing into neighboring blocks', () => {
    const items: Item[] = [
      row('alpha'),
      { kind: 'hr' },
      row('bravo'),
      row('charlie'),
      { kind: 'hr' },
      row('delta'),
    ];
    const cursorItems = scope(items).items;

    expect(
      blockTarget({ items, cursorItems, current: current(items, target('alpha')), direction: 1 })
        ?.target.path,
    ).to.eql(['bravo']);
    expect(
      blockTarget({ items, cursorItems, current: current(items, target('bravo')), direction: 1 })
        ?.target.path,
    ).to.eql(['charlie']);
    expect(
      blockTarget({ items, cursorItems, current: current(items, target('charlie')), direction: 1 })
        ?.target.path,
    ).to.eql(['delta']);
    expect(
      blockTarget({ items, cursorItems, current: current(items, target('delta')), direction: -1 })
        ?.target.path,
    ).to.eql(['charlie']);
    expect(
      blockTarget({ items, cursorItems, current: current(items, target('charlie')), direction: -1 })
        ?.target.path,
    ).to.eql(['bravo']);
    expect(
      blockTarget({ items, cursorItems, current: current(items, target('bravo')), direction: -1 })
        ?.target.path,
    ).to.eql(['alpha']);
  });

  it('skips leading, trailing, consecutive, empty, and unaddressable blocks', () => {
    const items: Item[] = [
      { kind: 'hr' },
      row('alpha'),
      { kind: 'hr' },
      { kind: 'hr' },
      { k: 'missing id' },
      { id: 'duplicate', k: 'duplicate:a' },
      { id: 'duplicate', k: 'duplicate:b' },
      { kind: 'hr' },
      row('bravo'),
      { kind: 'hr' },
    ];
    const cursorItems = scope(items).items;

    expect(
      blockTarget({ items, cursorItems, current: current(items, target('alpha')), direction: 1 })
        ?.target.path,
    ).to.eql(['bravo']);
    expect(
      blockTarget({ items, cursorItems, current: current(items, target('bravo')), direction: -1 })
        ?.target.path,
    ).to.eql(['alpha']);
  });

  it('treats stable hr current targets as delimiters, not block members', () => {
    const items: Item[] = [row('alpha'), { id: 'cut', kind: 'hr' }, row('bravo')];
    const cursorItems = scope(items).items;
    const hr = current(items, target('cut'));

    expect(blockTarget({ items, cursorItems, current: hr, direction: 1 })?.target.path).to.eql([
      'bravo',
    ]);
    expect(blockTarget({ items, cursorItems, current: hr, direction: -1 })?.target.path).to.eql([
      'alpha',
    ]);
  });

  it('keeps nested group block scopes isolated from their parent scope', () => {
    const items: Item[] = [
      row('alpha'),
      { kind: 'hr' },
      {
        id: 'group',
        kind: 'group',
        items: [row('one'), { kind: 'hr' }, row('two')],
      },
      { kind: 'hr' },
      row('charlie'),
    ];

    expect(
      blockTarget({
        items,
        cursorItems: scope(items).items,
        current: current(items, target('alpha')),
        direction: 1,
      })?.target.path,
    ).to.eql(['group']);
    expect(
      blockTarget({
        items,
        cursorItems: scope(items).items,
        current: current(items, target('group')),
        direction: 1,
      })?.target.path,
    ).to.eql(['charlie']);

    const nestedItems = (items[2] as t.KeyValue.Item.Group).items;
    expect(
      blockTarget({
        items: nestedItems,
        cursorItems: scope(items, ['group']).items,
        current: current(items, target('group', 'one')),
        direction: 1,
      })?.target.path,
    ).to.eql(['group', 'two']);
  });

  it('returns undefined when no destination edge exists or current is not in the scope items', () => {
    const items: Item[] = [row('alpha'), { kind: 'hr' }, row('bravo')];
    const cursorItems = scope(items).items;

    expect(
      blockTarget({ items, cursorItems, current: current(items, target('alpha')), direction: -1 }),
    )
      .to.eql(undefined);
    expect(
      blockTarget({ items, cursorItems, current: current(items, target('bravo')), direction: 1 }),
    )
      .to.eql(undefined);
    expect(
      blockTarget({
        items,
        cursorItems,
        current: current([row('outside')], target('outside')),
        direction: 1,
      }),
    ).to.eql(undefined);
  });
});
