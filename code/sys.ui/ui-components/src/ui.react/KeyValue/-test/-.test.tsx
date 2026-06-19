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
import { toReorderModel } from '../u.reorder.ts';

describe('KeyValue', () => {
  describe('spec samples', () => {
    it('all visible samples provide stable reorder identity', () => {
      const samples: SampleKind[] = ['simple', 'comprehensive', 'opacity', 'links', 'reorder'];

      samples.forEach((sample) => {
        const items = SAMPLE.items(sample) ?? [];
        expect(items.every((item) => Is.string(item.id))).to.equal(true);
        expect(toReorderModel(items)?.ids.length).to.equal(items.length);
      });
    });
  });

  describe('types', () => {
    describe('item identity', () => {
      it('accepts optional ids on every item kind', () => {
        const items: t.KeyValue.Item[] = [
          { id: 'row', k: 'row', v: 'value' },
          { id: 'title', kind: 'title', v: 'Title' },
          { id: 'hr', kind: 'hr' },
          { id: 'spacer', kind: 'spacer', size: 8 },
        ];
        expectTypeOf(items).toEqualTypeOf<t.KeyValue.Item[]>();
        expect(items.map((item) => item.id)).to.eql(['row', 'title', 'hr', 'spacer']);
      });
    });

    describe('reorder', () => {
      it('exposes the public Reorder type family', () => {
        const items: t.KeyValue.Item[] = [{ id: 'row', k: 'row', v: 'value' }];
        const change: t.KeyValue.Reorder.Change = { next: items };
        const handler: t.KeyValue.Reorder.Handler = (e) => e.next;
        const reorder: t.KeyValue.Reorder = { onChange: handler };

        expectTypeOf(change).toEqualTypeOf<t.KeyValue.Reorder.Change>();
        expectTypeOf(handler).toEqualTypeOf<t.KeyValue.Reorder.Handler>();
        expectTypeOf(reorder).toEqualTypeOf<t.KeyValue.Reorder>();
        expect(change.next).to.equal(items);
      });
    });
  });

  describe('KeyValue.UI: item shell', () => {
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
  });
});
