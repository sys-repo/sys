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
      const props = { label: 'connect', enabled: true } satisfies t.KeyValue.ActionButton.Props;
      const element = KeyValue.ActionButton(props);
      const button = React.isValidElement<RenderedActionButtonProps>(element) ? element : undefined;

      const aliasProps: t.KeyValue.ActionButtonProps = props;

      expectTypeOf(KeyValue.ActionButton).toEqualTypeOf<React.FC<t.KeyValue.ActionButton.Props>>();
      expectTypeOf(aliasProps).toEqualTypeOf<t.KeyValue.ActionButton.Props>();
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
      const row: t.KeyValue.Row = { k: 'site', v: 'https://example.com', href };

      const legacyProps: t.KeyValue.LinkProps = props;
      const legacyDef: t.KeyValue.LinkDef = def;
      const legacyHref: t.KeyValue.Href = href;

      expectTypeOf(props.open).toMatchTypeOf<t.KeyValue.Link.Open | undefined>();
      expectTypeOf(props.display).toMatchTypeOf<t.KeyValue.Link.Display | undefined>();
      expectTypeOf(legacyProps).toEqualTypeOf<t.KeyValue.Link.Props>();
      expect(legacyDef).to.equal(def);
      expect(legacyHref).to.equal(href);
      expect(row.href).to.equal(href);
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

  describe('focus', () => {
    it('exposes the public Focus type family', () => {
      const ref: t.KeyValue.Focus.Ref = { path: ['group', 'row'] };
      const model: t.KeyValue.Focus.Model = { active: ref };
      const scope: t.KeyValue.Focus.Scope = { path: ['group'], items: [] };
      const command: t.KeyValue.Focus.Command<'focus:set'> = {
        name: 'focus:set',
        payload: { ref },
      };
      const change: t.KeyValue.Focus.EntryChange = {
        reason: 'focus:entry',
        entry: 'option-click',
        previous: {},
        next: model,
        ref,
        command,
      };
      const navigation: t.KeyValue.Focus.NavigationChange = {
        reason: 'focus:navigation',
        navigation: 'keyboard',
        key: 'ArrowDown',
        previous: model,
        next: model,
        command: { name: 'focus:next', payload: {} },
      };
      const focus: t.KeyValue.Focus.Props = {
        model,
        entry: 'click',
        navigation: 'keyboard',
        onChange: (e) => e.next,
      };
      const props: t.KeyValue.Props = { focus };

      expectTypeOf(KeyValue.Focus).toEqualTypeOf<t.KeyValue.Focus.Lib>();
      expectTypeOf(ref).toEqualTypeOf<t.KeyValue.Focus.Ref>();
      expectTypeOf(model).toEqualTypeOf<t.KeyValue.Focus.Model>();
      expectTypeOf(command).toEqualTypeOf<t.KeyValue.Focus.Command<'focus:set'>>();
      expectTypeOf(change).toEqualTypeOf<t.KeyValue.Focus.EntryChange>();
      expectTypeOf(navigation).toEqualTypeOf<t.KeyValue.Focus.NavigationChange>();
      expectTypeOf(change).toMatchTypeOf<t.KeyValue.Focus.Change>();
      expectTypeOf(navigation).toMatchTypeOf<t.KeyValue.Focus.Change>();
      expectTypeOf(focus).toEqualTypeOf<t.KeyValue.Focus.Props>();
      expectTypeOf(scope).toEqualTypeOf<t.KeyValue.Focus.Scope>();
      expect(props.focus).to.equal(focus);
      expect(KeyValue.Focus.eql(ref, model.active)).to.eql(true);
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
