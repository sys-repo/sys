import {
  act,
  afterEach,
  beforeEach,
  describe,
  DomMock,
  expect,
  expectTypeOf,
  Is,
  it,
  Schedule,
  type t,
  TestReact,
} from '../../../-test.ts';
import { SAMPLE, type SampleKind } from '../-spec/-samples.tsx';
import { KeyValue } from '../mod.ts';
import { toReorderModel } from '../u/u.reorder.ts';

describe('KeyValue', () => {
  describe('spec samples', () => {
    it('all visible samples provide stable reorder identity', () => {
      const samples: SampleKind[] = ['simple', 'comprehensive', 'opacity', 'links', 'recursive', 'reorder'];

      samples.forEach((sample) => {
        const items = SAMPLE.items(sample) ?? [];
        expect(items.every((item) => Is.string(item.id))).to.equal(true);
        expect(toReorderModel(items)?.ids.length).to.equal(items.length);
      });
    });
  });

  describe('types', () => {
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

  describe('KeyValue.UI: item boundaries', () => {
    DomMock.init({ beforeEach, afterEach });

    const items: t.KeyValue.Item[] = [
      { id: 'row:a', k: 'alpha', v: 'one' },
      { id: 'title', kind: 'title', v: 'Title' },
      { id: 'hr', kind: 'hr' },
      { id: 'spacer', kind: 'spacer', size: 8 },
      { id: 'row:b', k: 'bravo', v: 'two' },
    ];
    const layout: t.KeyValue.Layout = { kind: 'table' };

    it('renders one direct table child per KeyValue item', async () => {
      const el = <KeyValue.UI items={items} layout={layout} />;
      const res = await TestReact.render(el, { strict: false });
      const root = res.container.firstElementChild as HTMLElement;
      expect(root.children.length).to.equal(items.length);

      act(() => res.dispose());
      await Schedule.micro();
    });

    it('renders one direct table child per KeyValue item in reorder mode', async () => {
      const el = <KeyValue.UI items={items} layout={layout} reorder={{ onChange: () => undefined }} />;
      const res = await TestReact.render(el, { strict: false });
      const root = res.container.firstElementChild as HTMLElement;
      expect(root.children.length).to.equal(items.length);

      act(() => res.dispose());
      await Schedule.micro();
    });

    it('falls back to the static path when reorder identity is invalid', async () => {
      const invalid: t.KeyValue.Item[] = [{ id: 'a', k: 'alpha' }, { k: 'bravo' }];
      const el = <KeyValue.UI items={invalid} layout={layout} reorder={{ onChange: () => undefined }} />;
      const res = await TestReact.render(el, { strict: false });
      const root = res.container.firstElementChild as HTMLElement;
      expect(root.children.length).to.equal(invalid.length);

      act(() => res.dispose());
      await Schedule.micro();
    });

    it('renders recursive groups as one direct child', async () => {
      const group: t.KeyValue.Group = {
        id: 'group:status',
        kind: 'group',
        items: [
          { id: 'status', k: 'status', v: 'on' },
          { id: 'status:title', k: 'title status', v: 'on' },
        ],
      };
      const grouped: t.KeyValue.Item[] = [group, { id: 'events', k: 'events', v: 'on' }];
      const el = <KeyValue.UI items={grouped} layout={layout} />;
      const res = await TestReact.render(el, { strict: false });
      const root = res.container.firstElementChild as HTMLElement;
      const groupEl = root.children.item(0) as HTMLElement;

      expect(root.children.length).to.equal(grouped.length);
      expect(groupEl.children.length).to.equal(group.items.length);

      act(() => res.dispose());
      await Schedule.micro();
    });
  });
});
