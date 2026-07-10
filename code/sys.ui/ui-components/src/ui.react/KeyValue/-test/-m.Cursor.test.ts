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

  it('resolves root cursor scope with groups as atoms', () => {
    const scope = Cursor.scope(items);

    expect(scope.path).to.eql([]);
    expect(scope.items.map((item) => item.id)).to.eql(['alpha', 'group:bravo', 'charlie']);
    expect(scope.items.map((item) => item.target.path)).to.eql([
      ['alpha'],
      ['group:bravo'],
      ['charlie'],
    ]);
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

  it('enters groups and exits to the parent group atom', () => {
    const entered = Cursor.enter({ current: target('group:bravo') }, items);
    const nested = Cursor.enter({ current: target('group:bravo', 'group:bravo.two') }, items);
    const exitedNested = Cursor.exit(nested);
    const exitedGroup = Cursor.exit(entered);
    const exitedRoot = Cursor.exit({ current: target('group:bravo') });

    expect(entered.current?.path).to.eql(['group:bravo', 'bravo.one']);
    expect(nested.current?.path).to.eql(['group:bravo', 'group:bravo.two', 'bravo.two.a']);
    expect(exitedNested.current?.path).to.eql(['group:bravo', 'group:bravo.two']);
    expect(exitedGroup.current?.path).to.eql(['group:bravo']);
    expect(exitedRoot.current).to.eql(undefined);
  });

  it('does not enter groups without cursor-addressable children', () => {
    const input: Item[] = [{ id: 'group:empty', kind: 'group', items: [{ k: 'missing id' }] }];
    const model: t.KeyValue.Cursor.Model = { current: target('group:empty') };

    expect(Cursor.scope(input).items[0]?.enterable).to.eql(false);
    expect(Cursor.enter(model, input)).to.equal(model);
  });

  it('applies data-only cursor commands', () => {
    const set: t.KeyValue.Cursor.Command<'cursor:set'> = {
      name: 'cursor:set',
      payload: { target: target('alpha') },
    };
    const next: t.KeyValue.Cursor.Command<'cursor:next'> = { name: 'cursor:next', payload: {} };
    const exit: t.KeyValue.Cursor.Command<'cursor:exit'> = { name: 'cursor:exit', payload: {} };

    const current = Cursor.apply({}, items, set);
    const moved = Cursor.apply(current, items, next);
    const cleared = Cursor.apply(moved, items, exit);

    expect(current.current?.path).to.eql(['alpha']);
    expect(moved.current?.path).to.eql(['group:bravo']);
    expect(cleared.current).to.eql(undefined);
  });
});
