import { describe, expect, expectTypeOf, it, type t } from '../../../-test.ts';

describe('KeyValue/t', () => {
  describe('item identity', () => {
    it('accepts stable ids on every item kind', () => {
      const items: t.KeyValue.Item[] = [
        { id: 'row', k: 'row', v: 'value' },
        { id: 'title', kind: 'title', v: 'Title' },
        { id: 'hr', kind: 'hr' },
        { id: 'spacer', kind: 'spacer', size: 8 },
        { id: 'group', kind: 'group', items: [{ id: 'group:row', k: 'nested' }] },
      ];

      expectTypeOf(items).toEqualTypeOf<t.KeyValue.Item[]>();
      expect(items.map((item) => item.id)).to.eql(['row', 'title', 'hr', 'spacer', 'group']);
    });
  });

  describe('reorder', () => {
    it('exposes the public Reorder type family', () => {
      const items: t.KeyValue.Item[] = [{ id: 'row', k: 'row', v: 'value' }];
      const active: t.KeyValue.Reorder.ItemRef = { id: 'row', item: items[0], index: 0 };
      const start: t.KeyValue.Reorder.Start = { active, items };
      const change: t.KeyValue.Reorder.Change = { next: items };
      const end: t.KeyValue.Reorder.End = { active, items, changed: true };
      const onStart: t.KeyValue.Reorder.StartHandler = (e) => e.items;
      const onChange: t.KeyValue.Reorder.ChangeHandler = (e) => e.next;
      const onEnd: t.KeyValue.Reorder.EndHandler = (e) => e.changed;
      const reorder: t.KeyValue.Reorder = { onStart, onChange, onEnd };

      expectTypeOf(active).toEqualTypeOf<t.KeyValue.Reorder.ItemRef>();
      expectTypeOf(start).toEqualTypeOf<t.KeyValue.Reorder.Start>();
      expectTypeOf(change).toEqualTypeOf<t.KeyValue.Reorder.Change>();
      expectTypeOf(end).toEqualTypeOf<t.KeyValue.Reorder.End>();
      expectTypeOf(onStart).toEqualTypeOf<t.KeyValue.Reorder.StartHandler>();
      expectTypeOf(onChange).toEqualTypeOf<t.KeyValue.Reorder.ChangeHandler>();
      expectTypeOf(onChange).toEqualTypeOf<t.KeyValue.Reorder.Handler>();
      expectTypeOf(onEnd).toEqualTypeOf<t.KeyValue.Reorder.EndHandler>();
      expectTypeOf(reorder).toEqualTypeOf<t.KeyValue.Reorder>();
      expect(start.items).to.equal(items);
      expect(change.next).to.equal(items);
      expect(end.items).to.equal(items);
    });
  });
});
