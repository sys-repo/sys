import React from 'react';
import { Color, describe, expect, expectTypeOf, it, type t } from '../../../-test.ts';
import { KeyValue } from '../mod.ts';

type RenderedActionButtonProps = {
  readonly label?: React.ReactNode;
  readonly padding?: readonly [number, number];
  readonly style?: { readonly backgroundColor?: string; readonly borderRadius?: number };
};

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

  describe('ActionButton', () => {
    it('exposes a compact action button on the public KeyValue surface', () => {
      const props = { label: 'connect', enabled: true } satisfies t.KeyValue.ActionButtonProps;
      const element = KeyValue.ActionButton(props);
      const button = React.isValidElement<RenderedActionButtonProps>(element) ? element : undefined;

      expectTypeOf(KeyValue.ActionButton).toEqualTypeOf<React.FC<t.KeyValue.ActionButtonProps>>();
      expect(button?.props.padding).to.eql([0, 8]);
      expect(button?.props.style?.backgroundColor).to.eql(Color.BLUE);
      expect(button?.props.style?.borderRadius).to.eql(3);
    });
  });

  describe('animation', () => {
    it('exposes the public projection animation type family', () => {
      const projection: t.KeyValue.Animation.Projection = {
        duration: 150 as t.Msecs,
        ease: 'easeInOut',
      };
      const animation: t.KeyValue.Animation = { projection };
      const props: t.KeyValue.Props = { animation };

      expectTypeOf(projection).toEqualTypeOf<t.KeyValue.Animation.Projection>();
      expect(props.animation).to.equal(animation);
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
