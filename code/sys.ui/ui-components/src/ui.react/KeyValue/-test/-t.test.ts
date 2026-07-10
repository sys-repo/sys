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
      const row: t.KeyValue.Item.Row = { id: 'row', k: 'row', v: 'value' };
      const title: t.KeyValue.Item.Title = { id: 'title', kind: 'title', v: 'Title' };
      const hr: t.KeyValue.Item.Hr = { id: 'hr', kind: 'hr' };
      const spacer: t.KeyValue.Item.Spacer = { id: 'spacer', kind: 'spacer', size: 8 };
      const group: t.KeyValue.Item.Group = {
        id: 'group',
        kind: 'group',
        items: [{ id: 'group:row', k: 'nested' }],
      };
      const items: t.KeyValue.Item[] = [row, title, hr, spacer, group];
      const spacing: t.KeyValue.Item.Spacing = [1, 2];
      const opacity: t.KeyValue.Item.Opacity = { k: 0.5, v: 0.75 };

      expectTypeOf(items).toEqualTypeOf<t.KeyValue.Item[]>();
      expect(spacing).to.eql([1, 2]);
      expect(opacity).to.eql({ k: 0.5, v: 0.75 });
      expect(items.map((item) => item.id)).to.eql(['row', 'title', 'hr', 'spacer', 'group']);
    });
  });

  describe('ActionButton', () => {
    it('exposes a compact action button on the public KeyValue surface', () => {
      const props = { label: 'connect', enabled: true } satisfies t.KeyValue.ActionButton.Props;
      const element = KeyValue.ActionButton(props);
      const button = React.isValidElement<RenderedActionButtonProps>(element) ? element : undefined;

      expectTypeOf(KeyValue.ActionButton).toEqualTypeOf<React.FC<t.KeyValue.ActionButton.Props>>();
      expect(button?.props.padding).to.eql([0, 8]);
      expect(button?.props.style?.backgroundColor).to.eql(Color.BLUE);
      expect(button?.props.style?.borderRadius).to.eql(3);
    });
  });

  describe('Link', () => {
    it('exposes the public Link type family', () => {
      const props: t.KeyValue.Link.Props = {
        href: 'https://example.com',
        open: 'inline',
        display: 'trim-http',
      };
      const def: t.KeyValue.Link.Def = props;
      const href: t.KeyValue.Link.Href = { k: true, v: def };
      const row: t.KeyValue.Item.Row = { k: 'site', v: 'https://example.com', href };

      expectTypeOf(props.open).toMatchTypeOf<t.KeyValue.Link.Open | undefined>();
      expectTypeOf(props.display).toMatchTypeOf<t.KeyValue.Link.Display | undefined>();
      expect(row.href).to.equal(href);
    });
  });

  describe('Layout', () => {
    it('exposes the public Layout type family', () => {
      const common: t.KeyValue.Layout.Common = { columnGap: 8 };
      const spaced: t.KeyValue.Layout.Spaced = { ...common, kind: 'spaced' };
      const table: t.KeyValue.Layout.Table = { ...common, kind: 'table', keyAlign: 'right' };
      const layout: t.KeyValue.Layout = table;

      expectTypeOf(spaced).toEqualTypeOf<t.KeyValue.Layout.Spaced>();
      expectTypeOf(table).toEqualTypeOf<t.KeyValue.Layout.Table>();
      expectTypeOf(common).toEqualTypeOf<t.KeyValue.Layout.Common>();
      expect(layout.kind).to.eql('table');
    });
  });

  describe('FromObject', () => {
    it('exposes the public FromObject type family', () => {
      const options: t.KeyValue.FromObject.Options = {
        filter: (key) => key !== 'skip',
        format: (value) => String(value),
      };
      const fromObject: t.KeyValue.FromObject = (_obj, _options) => [];

      expectTypeOf(options).toEqualTypeOf<t.KeyValue.FromObject.Options>();
      expect(fromObject({}, options)).to.eql([]);
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

  describe('cursor', () => {
    it('exposes the public Cursor type family', () => {
      const target: t.KeyValue.Cursor.Target = { path: ['group', 'row'] };
      const model: t.KeyValue.Cursor.Model = { current: target };
      const scope: t.KeyValue.Cursor.Scope = { path: ['group'], items: [] };
      const command: t.KeyValue.Cursor.Command<'cursor:set'> = {
        name: 'cursor:set',
        payload: { target },
      };
      const change: t.KeyValue.Cursor.EntryChange = {
        reason: 'cursor:entry',
        entry: 'option-click',
        previous: {},
        next: model,
        target,
        command,
      };
      const navigation: t.KeyValue.Cursor.NavigationChange = {
        reason: 'cursor:navigation',
        navigation: 'keyboard',
        key: 'ArrowDown',
        previous: model,
        next: model,
        command: { name: 'cursor:next', payload: {} },
      };
      const cursor: t.KeyValue.Cursor.Props = {
        model,
        entry: 'click',
        navigation: 'keyboard',
        onChange: (e) => e.next,
      };
      const props: t.KeyValue.Props = { cursor };

      expectTypeOf(KeyValue.Cursor).toEqualTypeOf<t.KeyValue.Cursor.Lib>();
      expectTypeOf(target).toEqualTypeOf<t.KeyValue.Cursor.Target>();
      expectTypeOf(model).toEqualTypeOf<t.KeyValue.Cursor.Model>();
      expectTypeOf(command).toEqualTypeOf<t.KeyValue.Cursor.Command<'cursor:set'>>();
      expectTypeOf(change).toEqualTypeOf<t.KeyValue.Cursor.EntryChange>();
      expectTypeOf(navigation).toEqualTypeOf<t.KeyValue.Cursor.NavigationChange>();
      expectTypeOf(change).toMatchTypeOf<t.KeyValue.Cursor.Change>();
      expectTypeOf(navigation).toMatchTypeOf<t.KeyValue.Cursor.Change>();
      expectTypeOf(cursor).toEqualTypeOf<t.KeyValue.Cursor.Props>();
      expectTypeOf(scope).toEqualTypeOf<t.KeyValue.Cursor.Scope>();
      expect(props.cursor).to.equal(cursor);
      expect(KeyValue.Cursor.eql(target, model.current)).to.eql(true);
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
      expectTypeOf(onEnd).toEqualTypeOf<t.KeyValue.Reorder.EndHandler>();
      expectTypeOf(reorder).toEqualTypeOf<t.KeyValue.Reorder>();
      expect(start.items).to.equal(items);
      expect(change.next).to.equal(items);
      expect(end.items).to.equal(items);
    });
  });
});
