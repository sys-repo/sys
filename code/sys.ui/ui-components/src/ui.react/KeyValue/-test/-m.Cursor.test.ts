import { describe, expect, expectTypeOf, it, type t } from '../../../-test.ts';
import { Cursor } from '../m.Cursor/mod.ts';
import { KeyValue } from '../mod.ts';

type Item = t.KeyValue.Item;

const items: Item[] = [
  { id: 'alpha', k: 'alpha' },
  {
    id: 'group:bravo',
    kind: 'group',
    items: [
      { id: 'bravo.one', k: 'bravo.one' },
      {
        id: 'group:bravo.two',
        kind: 'group',
        items: [
          { id: 'bravo.two.a', k: 'bravo.two.a' },
          { id: 'bravo.two.b', k: 'bravo.two.b' },
        ],
      },
    ],
  },
  { id: 'charlie', k: 'charlie' },
];

const target = (...path: t.ObjectPath): t.KeyValue.Cursor.Target => Cursor.target(path);
const partTarget = (
  part: t.KeyValue.Cursor.Part,
  ...path: t.ObjectPath
): t.KeyValue.Cursor.Target => Cursor.target(path, part);

describe('KeyValue.Cursor', () => {
  it('is exposed on the public KeyValue runtime surface', () => {
    expect(KeyValue.Cursor).to.equal(Cursor);
    expectTypeOf(KeyValue.Cursor).toEqualTypeOf<t.KeyValue.Cursor.Lib>();
  });

  it('copies ObjectPath inputs at cursor boundaries', () => {
    const path: t.ObjectPath = ['group:bravo'];
    const cursorTarget = Cursor.target(path);
    const model = Cursor.set({}, items, cursorTarget);
    const scope = Cursor.scope(items, path);

    path[0] = 'mutated';
    cursorTarget.path[0] = 'also-mutated';

    expect(model.current?.path).to.eql(['group:bravo']);
    expect(scope.path).to.eql(['group:bravo']);
    expect(scope.items[0]?.target.path).to.eql(['group:bravo', 'bravo.one']);
  });

  it('includes cursor lane parts in target identity without creating a row part', () => {
    const row = target('alpha');
    const key = partTarget('key', 'alpha');
    const value = partTarget('value', 'alpha');

    expect(row).to.eql({ path: ['alpha'] });
    expect(key).to.eql({ path: ['alpha'], part: 'key' });
    expect(value).to.eql({ path: ['alpha'], part: 'value' });
    expect(Cursor.eql(row, key)).to.eql(false);
    expect(Cursor.eql(key, value)).to.eql(false);
    expect(Cursor.eql(key, partTarget('key', 'alpha'))).to.eql(true);
  });

  it('resolves root cursor scope with groups as atoms', () => {
    const scope = Cursor.scope(items);

    expect(scope.path).to.eql([]);
    expect(scope.items.map((item) => item.id)).to.eql(['alpha', 'group:bravo', 'charlie']);
    expect(scope.items.map((item) => item.target.path)).to.eql([
      ['alpha'],
      ['group:bravo'],
      ['charlie'],
    ]);
    expect(scope.items.map((item) => item.parts)).to.eql([['key', 'value'], [], ['key', 'value']]);
    expect(scope.items.map((item) => item.enterable)).to.eql([false, true, false]);
  });

  it('resolves nested scopes using ObjectPath-compatible targets', () => {
    const scope = Cursor.scope(items, ['group:bravo']);
    const nested = Cursor.scope(items, ['group:bravo', 'group:bravo.two']);

    expect(scope.items.map((item) => item.target.path)).to.eql([
      ['group:bravo', 'bravo.one'],
      ['group:bravo', 'group:bravo.two'],
    ]);
    expect(nested.items.map((item) => item.target.path)).to.eql([
      ['group:bravo', 'group:bravo.two', 'bravo.two.a'],
      ['group:bravo', 'group:bravo.two', 'bravo.two.b'],
    ]);
  });

  it('excludes unstable direct-scope identities', () => {
    const scoped: Item[] = [
      { id: 'stable', k: 'stable' },
      { k: 'missing' },
      { id: ' ', k: 'blank' },
      { id: 'duplicate', k: 'duplicate:a' },
      { id: 'duplicate', k: 'duplicate:b' },
      {
        id: 'group:nested',
        kind: 'group',
        items: [
          { id: 'duplicate', k: 'nested duplicate is in another scope' },
          { id: 'nested', k: 'nested' },
        ],
      },
    ];

    const scope = Cursor.scope(scoped);
    const nested = Cursor.scope(scoped, ['group:nested']);

    expect(scope.items.map((item) => item.id)).to.eql(['stable', 'group:nested']);
    expect(nested.items.map((item) => item.id)).to.eql(['duplicate', 'nested']);
  });

  it('does not resolve child scopes through unstable parent identities', () => {
    const scoped: Item[] = [
      { id: 'stable', k: 'stable' },
      { id: 'group:duplicate', kind: 'group', items: [{ id: 'first', k: 'first' }] },
      { id: 'group:duplicate', kind: 'group', items: [{ id: 'second', k: 'second' }] },
      { id: ' ', kind: 'group', items: [{ id: 'blank.child', k: 'blank child' }] },
    ];

    expect(Cursor.scope(scoped).items.map((item) => item.id)).to.eql(['stable']);
    expect(Cursor.scope(scoped, ['group:duplicate']).items).to.eql([]);
    expect(Cursor.scope(scoped, [' ']).items).to.eql([]);
    expect(Cursor.set({}, scoped, target('group:duplicate', 'first')).current).to.eql(undefined);
    expect(Cursor.set({}, scoped, target(' ', 'blank.child')).current).to.eql(undefined);
  });

  it('sets current cursor only when the target exists', () => {
    const model: t.KeyValue.Cursor.Model = {};
    const current = Cursor.set(model, items, target('group:bravo'));
    const unchanged = Cursor.set(current, items, target('missing'));

    expect(current.current?.path).to.eql(['group:bravo']);
    expect(unchanged.current?.path).to.eql(['group:bravo']);
  });

  it('sets current cursor lane parts only for rendered rows', () => {
    const current = Cursor.set({}, items, partTarget('key', 'alpha'));
    const value = Cursor.set(current, items, partTarget('value', 'alpha'));
    const unchanged = Cursor.set(value, items, partTarget('key', 'group:bravo'));

    expect(current.current).to.eql({ path: ['alpha'], part: 'key' });
    expect(value.current).to.eql({ path: ['alpha'], part: 'value' });
    expect(unchanged.current).to.eql({ path: ['alpha'], part: 'value' });
  });

  it('moves current cursor within the current scope without wrapping', () => {
    const model: t.KeyValue.Cursor.Model = { current: target('group:bravo') };

    expect(Cursor.next(model, items).current?.path).to.eql(['charlie']);
    expect(Cursor.next({ current: target('charlie') }, items).current?.path).to.eql(['charlie']);
    expect(Cursor.previous(model, items).current?.path).to.eql(['alpha']);
    expect(Cursor.previous({ current: target('alpha') }, items).current?.path).to.eql(['alpha']);
  });

  it('moves from empty cursor to the first or last cursor-addressable item', () => {
    expect(Cursor.next({}, items).current?.path).to.eql(['alpha']);
    expect(Cursor.previous({}, items).current?.path).to.eql(['charlie']);
  });

  it('navigates row key/value lanes without wrapping', () => {
    const atom: t.KeyValue.Cursor.Model = { current: target('alpha') };
    const key: t.KeyValue.Cursor.Model = { current: partTarget('key', 'alpha') };
    const value: t.KeyValue.Cursor.Model = { current: partTarget('value', 'alpha') };
    const group: t.KeyValue.Cursor.Model = { current: target('group:bravo') };

    expect(Cursor.left(atom, items).current).to.eql({ path: ['alpha'], part: 'key' });
    expect(Cursor.right(atom, items).current).to.eql({ path: ['alpha'], part: 'value' });
    expect(Cursor.left(key, items).current).to.eql({ path: ['alpha'], part: 'key' });
    expect(Cursor.right(key, items).current).to.eql({ path: ['alpha'], part: 'value' });
    expect(Cursor.left(value, items).current).to.eql({ path: ['alpha'], part: 'key' });
    expect(Cursor.right(value, items).current).to.eql({ path: ['alpha'], part: 'value' });
    expect(Cursor.left(group, items)).to.equal(group);
    expect(Cursor.right({}, items)).to.eql({});
  });

  it('preserves row lanes while moving through rows and falls back to atoms otherwise', () => {
    const rowItems: Item[] = [
      { id: 'alpha', k: 'alpha' },
      { id: 'bravo', k: 'bravo' },
      { id: 'group', kind: 'group', items: [{ id: 'child', k: 'child' }] },
    ];

    expect(Cursor.next({ current: partTarget('key', 'alpha') }, rowItems).current).to.eql({
      path: ['bravo'],
      part: 'key',
    });
    expect(Cursor.next({ current: partTarget('value', 'bravo') }, rowItems).current).to.eql({
      path: ['group'],
    });
    expect(Cursor.previous({ current: partTarget('key', 'group') }, rowItems).current).to.eql({
      path: ['bravo'],
    });
    expect(Cursor.previous({ current: partTarget('key', 'bravo') }, rowItems).current).to.eql({
      path: ['alpha'],
      part: 'key',
    });
  });

  it('moves by hr-delimited block edges while preserving supported lanes', () => {
    const blockItems: Item[] = [
      { id: 'alpha', k: 'alpha' },
      { kind: 'hr' },
      { id: 'bravo', k: 'bravo' },
      { id: 'charlie', k: 'charlie' },
      { kind: 'hr' },
      { id: 'title', kind: 'title', v: 'Title' },
      { id: 'delta', k: 'delta' },
    ];

    expect(Cursor.nextBlock({ current: partTarget('key', 'alpha') }, blockItems).current).to.eql({
      path: ['bravo'],
      part: 'key',
    });
    expect(Cursor.nextBlock({ current: partTarget('value', 'bravo') }, blockItems).current).to.eql({
      path: ['charlie'],
      part: 'value',
    });
    expect(Cursor.nextBlock({ current: partTarget('value', 'charlie') }, blockItems).current).to
      .eql({ path: ['title'] });
    expect(Cursor.previousBlock({ current: partTarget('value', 'delta') }, blockItems).current).to
      .eql({ path: ['title'] });
    expect(Cursor.previousBlock({ current: target('title') }, blockItems).current).to.eql({
      path: ['charlie'],
    });
    expect(Cursor.previousBlock({ current: partTarget('value', 'charlie') }, blockItems).current).to
      .eql({ path: ['bravo'], part: 'value' });
    expect(Cursor.previousBlock({ current: partTarget('key', 'bravo') }, blockItems).current).to
      .eql(
        { path: ['alpha'], part: 'key' },
      );
    expect(Cursor.previousBlock({ current: target('alpha') }, blockItems).current).to.eql({
      path: ['alpha'],
    });
    expect(Cursor.nextBlock({ current: target('delta') }, blockItems).current).to.eql({
      path: ['delta'],
    });
  });

  it('skips empty and unaddressable blocks when moving by block edges', () => {
    const blockItems: Item[] = [
      { kind: 'hr' },
      { id: 'alpha', k: 'alpha' },
      { kind: 'hr' },
      { kind: 'hr' },
      { k: 'missing id' },
      { id: 'duplicate', k: 'duplicate:a' },
      { id: 'duplicate', k: 'duplicate:b' },
      { kind: 'hr' },
      { id: 'bravo', k: 'bravo' },
      { kind: 'hr' },
    ];

    expect(Cursor.nextBlock({ current: target('alpha') }, blockItems).current).to.eql({
      path: ['bravo'],
    });
    expect(Cursor.previousBlock({ current: target('bravo') }, blockItems).current).to.eql({
      path: ['alpha'],
    });
  });

  it('jumps from stable hr delimiter targets without treating hr as block members', () => {
    const blockItems: Item[] = [
      { id: 'alpha', k: 'alpha' },
      { id: 'cut', kind: 'hr' },
      { id: 'bravo', k: 'bravo' },
    ];

    expect(Cursor.nextBlock({ current: target('cut') }, blockItems).current).to.eql({
      path: ['bravo'],
    });
    expect(Cursor.previousBlock({ current: target('cut') }, blockItems).current).to.eql({
      path: ['alpha'],
    });
  });

  it('keeps block-edge navigation isolated to the current sibling scope', () => {
    const blockItems: Item[] = [
      { id: 'alpha', k: 'alpha' },
      { kind: 'hr' },
      {
        id: 'group',
        kind: 'group',
        items: [
          { id: 'one', k: 'one' },
          { kind: 'hr' },
          { id: 'two', k: 'two' },
        ],
      },
      { kind: 'hr' },
      { id: 'charlie', k: 'charlie' },
    ];

    expect(Cursor.nextBlock({ current: target('alpha') }, blockItems).current).to.eql({
      path: ['group'],
    });
    expect(Cursor.nextBlock({ current: target('group') }, blockItems).current).to.eql({
      path: ['charlie'],
    });
    expect(Cursor.nextBlock({ current: target('group', 'one') }, blockItems).current).to.eql({
      path: ['group', 'two'],
    });
    expect(Cursor.previousBlock({ current: target('group', 'two') }, blockItems).current).to.eql({
      path: ['group', 'one'],
    });
  });

  it('does not move by block edges from empty or unresolved cursor targets', () => {
    const model: t.KeyValue.Cursor.Model = { current: target('missing') };
    const invalidPart: t.KeyValue.Cursor.Model = { current: partTarget('key', 'group:bravo') };

    expect(Cursor.nextBlock({}, items)).to.eql({});
    expect(Cursor.nextBlock(model, items)).to.equal(model);
    expect(Cursor.previousBlock(invalidPart, items)).to.equal(invalidPart);
  });

  it('enters groups and exits to the parent group atom', () => {
    const entered = Cursor.enter({ current: target('group:bravo') }, items);
    const nested = Cursor.enter({ current: target('group:bravo', 'group:bravo.two') }, items);
    const exitedNested = Cursor.exit(nested);
    const exitedGroup = Cursor.exit(entered);
    const exitedRoot = Cursor.exit({ current: target('group:bravo') });
    const exitedPart = Cursor.exit({ current: partTarget('value', 'alpha') });

    expect(entered.current?.path).to.eql(['group:bravo', 'bravo.one']);
    expect(nested.current?.path).to.eql(['group:bravo', 'group:bravo.two', 'bravo.two.a']);
    expect(exitedNested.current?.path).to.eql(['group:bravo', 'group:bravo.two']);
    expect(exitedGroup.current?.path).to.eql(['group:bravo']);
    expect(exitedRoot.current).to.eql(undefined);
    expect(exitedPart.current).to.eql({ path: ['alpha'] });
  });

  it('does not enter groups without cursor-addressable children', () => {
    const input: Item[] = [{ id: 'group:empty', kind: 'group', items: [{ k: 'missing id' }] }];
    const model: t.KeyValue.Cursor.Model = { current: target('group:empty') };

    expect(Cursor.scope(input).items[0]?.enterable).to.eql(false);
    expect(Cursor.enter(model, input)).to.equal(model);
  });

  it('routes data-only cursor commands through cmd', () => {
    const set: t.KeyValue.Cursor.Command<'cursor:set'> = {
      name: 'cursor:set',
      payload: { target: target('alpha') },
    };
    const next: t.KeyValue.Cursor.Command<'cursor:next'> = { name: 'cursor:next', payload: {} };
    const right: t.KeyValue.Cursor.Command<'cursor:right'> = { name: 'cursor:right', payload: {} };
    const nextBlock: t.KeyValue.Cursor.Command<'cursor:next-block'> = {
      name: 'cursor:next-block',
      payload: {},
    };
    const exit: t.KeyValue.Cursor.Command<'cursor:exit'> = { name: 'cursor:exit', payload: {} };

    const current = Cursor.cmd({}, items, set);
    const parted = Cursor.cmd(current, items, right);
    const atom = Cursor.cmd(parted, items, exit);
    const moved = Cursor.cmd(atom, items, next);
    const blockMoved = Cursor.cmd({ current: target('alpha') }, items, nextBlock);
    const cleared = Cursor.cmd(moved, items, exit);

    expect(current.current?.path).to.eql(['alpha']);
    expect(parted.current).to.eql({ path: ['alpha'], part: 'value' });
    expect(atom.current?.path).to.eql(['alpha']);
    expect(moved.current?.path).to.eql(['group:bravo']);
    expect(blockMoved.current?.path).to.eql(['charlie']);
    expect(cleared.current).to.eql(undefined);
  });
});
