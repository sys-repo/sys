import {
  act,
  afterEach,
  beforeEach,
  describe,
  DomMock,
  expect,
  expectTypeOf,
  it,
  Schedule,
  type t,
  TestReact,
} from '../../../-test.ts';
import { KeyValue } from '../mod.ts';

describe('KeyValue', () => {
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
  });

  describe('KeyValue.UI: item shell', () => {
    DomMock.init({ beforeEach, afterEach });

    it('renders one direct table child per KeyValue item', async () => {
      const items: t.KeyValue.Item[] = [
        { id: 'row:a', k: 'alpha', v: 'one' },
        { id: 'title', kind: 'title', v: 'Title' },
        { id: 'hr', kind: 'hr' },
        { id: 'spacer', kind: 'spacer', size: 8 },
        { id: 'row:b', k: 'bravo', v: 'two' },
      ];
      const layout: t.KeyValue.Layout = { kind: 'table' };

      const el = <KeyValue.UI items={items} layout={layout} />;
      const res = await TestReact.render(el, { strict: false });
      const root = res.container.firstElementChild as HTMLElement;
      expect(root.children.length).to.equal(items.length);

      act(() => res.dispose());
      await Schedule.micro();
    });
  });
});
