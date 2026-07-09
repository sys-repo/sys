import { describe, expect, expectTypeOf, it, type t } from '../../../-test.ts';
import { Focus } from '../m.Focus/mod.ts';
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

const ref = (...path: t.ObjectPath): t.KeyValue.Focus.Ref => Focus.ref(path);

describe('KeyValue.Focus', () => {
  it('is exposed on the public KeyValue runtime surface', () => {
    expect(KeyValue.Focus).to.equal(Focus);
    expectTypeOf(KeyValue.Focus).toEqualTypeOf<t.KeyValue.Focus.Lib>();
  });

  it('copies ObjectPath inputs at focus boundaries', () => {
    const path: t.ObjectPath = ['group:bravo'];
    const target = Focus.ref(path);
    const model = Focus.set({}, items, target);
    const scope = Focus.scope(items, path);

    path[0] = 'mutated';
    target.path[0] = 'also-mutated';

    expect(model.active?.path).to.eql(['group:bravo']);
    expect(scope.path).to.eql(['group:bravo']);
    expect(scope.items[0]?.ref.path).to.eql(['group:bravo', 'bravo.one']);
  });

  it('resolves root focus scope with groups as atoms', () => {
    const scope = Focus.scope(items);

    expect(scope.path).to.eql([]);
    expect(scope.items.map((item) => item.id)).to.eql(['alpha', 'group:bravo', 'charlie']);
    expect(scope.items.map((item) => item.ref.path)).to.eql([
      ['alpha'],
      ['group:bravo'],
      ['charlie'],
    ]);
    expect(scope.items.map((item) => item.enterable)).to.eql([false, true, false]);
  });

  it('resolves nested scopes using ObjectPath-compatible refs', () => {
    const scope = Focus.scope(items, ['group:bravo']);
    const nested = Focus.scope(items, ['group:bravo', 'group:bravo.two']);

    expect(scope.items.map((item) => item.ref.path)).to.eql([
      ['group:bravo', 'bravo.one'],
      ['group:bravo', 'group:bravo.two'],
    ]);
    expect(nested.items.map((item) => item.ref.path)).to.eql([
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

    const scope = Focus.scope(scoped);
    const nested = Focus.scope(scoped, ['group:nested']);

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

    expect(Focus.scope(scoped).items.map((item) => item.id)).to.eql(['stable']);
    expect(Focus.scope(scoped, ['group:duplicate']).items).to.eql([]);
    expect(Focus.scope(scoped, [' ']).items).to.eql([]);
    expect(Focus.set({}, scoped, ref('group:duplicate', 'first')).active).to.eql(undefined);
    expect(Focus.set({}, scoped, ref(' ', 'blank.child')).active).to.eql(undefined);
  });

  it('sets active focus only when the ref exists', () => {
    const model: t.KeyValue.Focus.Model = {};
    const active = Focus.set(model, items, ref('group:bravo'));
    const unchanged = Focus.set(active, items, ref('missing'));

    expect(active.active?.path).to.eql(['group:bravo']);
    expect(unchanged.active?.path).to.eql(['group:bravo']);
  });

  it('moves active focus within the current scope without wrapping', () => {
    const model: t.KeyValue.Focus.Model = { active: ref('group:bravo') };

    expect(Focus.next(model, items).active?.path).to.eql(['charlie']);
    expect(Focus.next({ active: ref('charlie') }, items).active?.path).to.eql(['charlie']);
    expect(Focus.previous(model, items).active?.path).to.eql(['alpha']);
    expect(Focus.previous({ active: ref('alpha') }, items).active?.path).to.eql(['alpha']);
  });

  it('moves from empty focus to the first or last focusable item', () => {
    expect(Focus.next({}, items).active?.path).to.eql(['alpha']);
    expect(Focus.previous({}, items).active?.path).to.eql(['charlie']);
  });

  it('enters groups and exits to the parent group atom', () => {
    const entered = Focus.enter({ active: ref('group:bravo') }, items);
    const nested = Focus.enter({ active: ref('group:bravo', 'group:bravo.two') }, items);
    const exitedNested = Focus.exit(nested);
    const exitedGroup = Focus.exit(entered);
    const exitedRoot = Focus.exit({ active: ref('group:bravo') });

    expect(entered.active?.path).to.eql(['group:bravo', 'bravo.one']);
    expect(nested.active?.path).to.eql(['group:bravo', 'group:bravo.two', 'bravo.two.a']);
    expect(exitedNested.active?.path).to.eql(['group:bravo', 'group:bravo.two']);
    expect(exitedGroup.active?.path).to.eql(['group:bravo']);
    expect(exitedRoot.active).to.eql(undefined);
  });

  it('does not enter groups without focusable children', () => {
    const input: Item[] = [{ id: 'group:empty', kind: 'group', items: [{ k: 'missing id' }] }];
    const model: t.KeyValue.Focus.Model = { active: ref('group:empty') };

    expect(Focus.scope(input).items[0]?.enterable).to.eql(false);
    expect(Focus.enter(model, input)).to.equal(model);
  });

  it('applies data-only focus commands', () => {
    const set: t.KeyValue.Focus.Command<'focus:set'> = {
      name: 'focus:set',
      payload: { ref: ref('alpha') },
    };
    const next: t.KeyValue.Focus.Command<'focus:next'> = { name: 'focus:next', payload: {} };
    const exit: t.KeyValue.Focus.Command<'focus:exit'> = { name: 'focus:exit', payload: {} };

    const active = Focus.apply({}, items, set);
    const moved = Focus.apply(active, items, next);
    const cleared = Focus.apply(moved, items, exit);

    expect(active.active?.path).to.eql(['alpha']);
    expect(moved.active?.path).to.eql(['group:bravo']);
    expect(cleared.active).to.eql(undefined);
  });
});
