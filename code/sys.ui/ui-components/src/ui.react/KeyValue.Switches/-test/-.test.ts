import React from 'react';
import { describe, expect, expectTypeOf, it, type t } from '../../../-test.ts';
import { KeyValue } from '../../KeyValue/mod.ts';
import { Switches } from '../mod.ts';

describe('KeyValue.Switches', () => {
  describe('exports', () => {
    it('is attached to the public KeyValue surface', async () => {
      const m = await import('@sys/ui-components/react/key-value');
      expect(m.KeyValue).to.equal(KeyValue);
      expect(m.KeyValue.Switches).to.equal(Switches);
      expect(m.KeyValue.Switches.toItem).to.equal(Switches.toItem);
      expect(m.KeyValue.Switches.toItems).to.equal(Switches.toItems);
    });
  });

  describe('types', () => {
    it('exposes switch contracts under the KeyValue namespace', () => {
      const lib: t.KeyValue.Switches.Lib = Switches;
      const props: t.KeyValue.Switches.Props = {};
      const group: t.KeyValue.Switches.Group = {
        id: 'group',
        kind: 'group',
        items: [{ id: 'nested' }, { kind: 'hr' }],
      };
      const items: t.KeyValue.Switches.Item[] = [{ id: 'sample' }, { kind: 'hr' }, group];
      const row: t.KeyValue.Switches.Row = { id: 'sample', x: 8, y: [2, 4] };
      const switchOptions: t.KeyValue.Switches.Item.SwitchOptions = { width: 26, height: 14 };

      expectTypeOf(lib).toEqualTypeOf<t.KeyValueSwitches.Lib>();
      expectTypeOf(props).toEqualTypeOf<t.KeyValueSwitches.Props>();
      expectTypeOf(group).toEqualTypeOf<t.KeyValueSwitches.Group>();
      expectTypeOf(items).toEqualTypeOf<t.KeyValueSwitches.Item[]>();
      expectTypeOf(row).toEqualTypeOf<t.KeyValueSwitches.Row>();
      expectTypeOf(switchOptions).toEqualTypeOf<t.KeyValueSwitches.Item.SwitchOptions>();
    });
  });

  describe('toItem', () => {
    it('maps one switch item to a KeyValue row', () => {
      const opacity: t.KeyValue.Row['opacity'] = { k: 0.3 };
      const row = Switches.toItem({ id: 'sample', value: true, opacity });

      expectTypeOf(row).toEqualTypeOf<t.KeyValue.Row>();
      expect(row.id).to.eql('sample');
      expect(row.kind).to.eql('row');
      expect(labelText(row.k)).to.eql('sample');
      expect(row.opacity).to.eql(opacity);
      expect(row.v).to.not.eql(undefined);
    });

    it('forwards row spacing to the generated KeyValue row', () => {
      const x: t.KeyValue.Row['x'] = [12, 0];
      const y: t.KeyValue.Row['y'] = [2, 4];
      const row = Switches.toItem({ id: 'sample', x, y });

      expect(row.x).to.eql(x);
      expect(row.y).to.eql(y);
    });
  });

  describe('toItems', () => {
    it('maps items in caller order', () => {
      const items = Switches.toItems([
        { id: 'alpha', value: true },
        { id: 'bravo', value: false },
      ]);

      expectTypeOf(items).toEqualTypeOf<t.KeyValue.Item[]>();
      expect(items.map((item) => labelText((item as t.KeyValue.Row).k))).to.eql(['alpha', 'bravo']);
    });

    it('preserves hr items in caller order', () => {
      const hr: t.KeyValue.Hr = { kind: 'hr', y: [8, 8] };
      const items = Switches.toItems([{ id: 'before' }, hr, { id: 'after' }]);

      expectTypeOf(items).toEqualTypeOf<t.KeyValue.Item[]>();
      expect(items[1]).to.equal(hr);
      expect(labelText((items[0] as t.KeyValue.Row).k)).to.eql('before');
      expect(labelText((items[2] as t.KeyValue.Row).k)).to.eql('after');
    });

    it('maps recursive switch groups to recursive KeyValue groups', () => {
      const hr: t.KeyValue.Hr = { id: 'nested-divider', kind: 'hr', y: [8, 8] };
      const items = Switches.toItems([
        { id: 'before' },
        {
          id: 'group',
          kind: 'group',
          items: [
            { id: 'nested', label: 'Nested' },
            hr,
            { id: 'deep', kind: 'group', items: [{ id: 'deep-row', label: 'Deep row' }] },
          ],
        },
        { id: 'after' },
      ]);

      expectTypeOf(items).toEqualTypeOf<t.KeyValue.Item[]>();
      expect(labelText((items[0] as t.KeyValue.Row).k)).to.eql('before');
      expect(labelText((items[2] as t.KeyValue.Row).k)).to.eql('after');

      const group = items[1] as t.KeyValue.Group;
      expect(group.id).to.eql('group');
      expect(group.kind).to.eql('group');
      expect(labelText((group.items[0] as t.KeyValue.Row).k)).to.eql('Nested');
      expect(group.items[1]).to.equal(hr);

      const deep = group.items[2] as t.KeyValue.Group;
      expect(deep.id).to.eql('deep');
      expect(deep.kind).to.eql('group');
      expect(labelText((deep.items[0] as t.KeyValue.Row).k)).to.eql('Deep row');
    });

    it('maps undefined input to an empty item list', () => {
      expect(Switches.toItems()).to.eql([]);
    });
  });
});

function labelText(input: t.ReactNode): t.ReactNode {
  expect(React.isValidElement(input)).to.eql(true);
  const props = (input as React.ReactElement<{ item: t.KeyValueSwitches.Row }>).props;
  return props.item.label ?? props.item.id;
}
